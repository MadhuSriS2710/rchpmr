import {
  useState,
  useEffect,
  useRef,
  useCallback
} from "react";

import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import AddPatient from "./pages/AddPatient";
import Schedule from "./pages/Schedule";
import Machines from "./pages/Machines";
import Therapists from "./pages/Therapists";
import Settings from "./pages/Settings";
import { LogOut } from "lucide-react";
import { apiService } from "./api/apiService";

import { patients as initialPatients } from "./data/patients";
import { machines as initialMachines } from "./data/machines";
import { therapists as initialTherapists } from "./data/therapists";

import { runScheduler } from "./scheduler/schedulerEngine";
import {
  getTherapistSetting,
  getTherapistQuota,
  isTherapistQuotaReached,
  getPatientSetting,
  CLINICAL_RATIOS
} from "./scheduler/schedulerRules";


function App() {

  // =====================================================
  // APPLICATION STATE
  // =====================================================

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [activePage, setActivePage] =
    useState("Dashboard");

  const [patientList, setPatientList] =
    useState(initialPatients);

  const [machineList, setMachineList] =
    useState(initialMachines);

  const [therapistList, setTherapistList] =
    useState(initialTherapists);

  const [activeSessions, setActiveSessions] =
    useState([]);

  const [notifications, setNotifications] =
    useState([]);

  const [timeReclaimed, setTimeReclaimed] =
    useState(0);

  const [completedSessions, setCompletedSessions] =
    useState(0);


  // =====================================================
  // REFS
  // =====================================================

  const patientListRef =
    useRef(initialPatients);

  const machineListRef =
    useRef(initialMachines);

  const therapistListRef =
    useRef(initialTherapists);

  const activeSessionsRef =
    useRef([]);

  const schedulerStartedRef =
    useRef(false);


  // =====================================================
  // SYNC REFS
  // =====================================================

  useEffect(() => {

    patientListRef.current =
      patientList;

  }, [patientList]);


  useEffect(() => {

    machineListRef.current =
      machineList;

  }, [machineList]);


  useEffect(() => {

    therapistListRef.current =
      therapistList;

  }, [therapistList]);


  useEffect(() => {

    activeSessionsRef.current =
      activeSessions;

  }, [activeSessions]);


  // =====================================================
  // REAL-TIME DATABASE SYNC ON MOUNT
  // =====================================================

  useEffect(() => {
    async function loadDatabaseRecords() {
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const lastActiveDate = localStorage.getItem("ipmr_last_date");

        // If opening on a new calendar day / morning shift, automatically reset daily states
        if (lastActiveDate && lastActiveDate !== todayStr) {
          console.log(`🌅 Morning shift detected (${todayStr} vs ${lastActiveDate}). Resetting daily states...`);
          await apiService.resetData();
          localStorage.setItem("ipmr_last_date", todayStr);
        } else if (!lastActiveDate) {
          localStorage.setItem("ipmr_last_date", todayStr);
        }

        const [dbPatients, dbMachines, dbTherapists] = await Promise.all([
          apiService.getPatients(),
          apiService.getMachines(),
          apiService.getTherapists()
        ]);

        if (dbPatients && Array.isArray(dbPatients) && dbPatients.length > 0) {
          setPatientList(dbPatients);
          patientListRef.current = dbPatients;
        }

        if (dbMachines && Array.isArray(dbMachines) && dbMachines.length > 0) {
          setMachineList(dbMachines);
          machineListRef.current = dbMachines;
        }

        if (dbTherapists && Array.isArray(dbTherapists) && dbTherapists.length > 0) {
          setTherapistList(dbTherapists);
          therapistListRef.current = dbTherapists;
        }
      } catch (err) {
        console.warn("Backend offline, running with local seed records:", err);
      }
    }

    loadDatabaseRecords();
  }, []);


  // =====================================================
  // NOTIFICATION SYSTEM
  // =====================================================

  const addNotification =
    useCallback(
      (
        type,
        title,
        message
      ) => {

        const notification = {

          id:
            `${Date.now()}-${Math.random()}`,

          type,

          title,

          message,

          time:
            new Date()

        };


        setNotifications(
          (current) => [

            notification,

            ...current

          ].slice(0, 30)
        );

      },
      []
    );


  // =====================================================
  // START THERAPY SESSION
  // =====================================================

  const startTherapySession =
    useCallback(
      (allocation) => {

        if (!allocation) {
          return false;
        }


        // Patient cannot use two machines
        const patientBusy =
          activeSessionsRef.current.some(
            (session) =>
              session.patientCode ===
              allocation.patientCode
          );


        // Machine cannot serve two patients
        const machineBusy =
          activeSessionsRef.current.some(
            (session) =>
              session.machineId ===
              allocation.machineId
          );


        if (
          patientBusy ||
          machineBusy
        ) {

          return false;

        }


        const totalSeconds =
          allocation.duration * 60;


        // -----------------------------------------------
        // ASSIGN MATCHING THERAPIST WITH CLINICAL RATIOS:
        // 1:6 Department Ratio (Max 6 patients/day)
        // 1:9 Ward Ratio (Max 9 patients/day)
        // -----------------------------------------------
        const patientObj = patientListRef.current.find(
          (p) => p.patientCode === allocation.patientCode
        );

        const patientSetting = getPatientSetting(patientObj);
        const targetDept = ["M-02", "M-03", "M-04"].includes(allocation.machineId)
          ? "Occupational Therapy"
          : "Physiotherapy";

        let assignedTherapist = null;

        // Check assigned / preferred clinician if still under ratio quota
        if (patientObj?.assignedTherapistId) {
          const pref = therapistListRef.current.find(
            (t) => t.id === patientObj.assignedTherapistId && t.status === "AVAILABLE"
          );
          if (pref && !isTherapistQuotaReached(pref)) {
            assignedTherapist = pref;
          }
        }

        // Priority 1: Available therapist in matching department AND matching care setting under quota
        if (!assignedTherapist) {
          assignedTherapist = therapistListRef.current.find(
            (t) =>
              t.department === targetDept &&
              getTherapistSetting(t) === patientSetting &&
              t.status === "AVAILABLE" &&
              !isTherapistQuotaReached(t)
          );
        }

        // Priority 2: Any therapist matching care setting under quota
        if (!assignedTherapist) {
          assignedTherapist = therapistListRef.current.find(
            (t) =>
              getTherapistSetting(t) === patientSetting &&
              t.status === "AVAILABLE" &&
              !isTherapistQuotaReached(t)
          );
        }

        // Priority 3: Any available clinician who hasn't reached daily ratio cap
        if (!assignedTherapist) {
          assignedTherapist = therapistListRef.current.find(
            (t) => t.status === "AVAILABLE" && !isTherapistQuotaReached(t)
          );
        }

        if (assignedTherapist) {
          const updatedTherapists = therapistListRef.current.map((t) => {
            if (t.id !== assignedTherapist.id) return t;
            return {
              ...t,
              status: "IN_SESSION",
              currentPatient: allocation.patientCode,
              currentMachine: allocation.machineId
            };
          });
          therapistListRef.current = updatedTherapists;
          setTherapistList(updatedTherapists);
        }

        const session = {

          id:
            `${allocation.patientCode}-${allocation.machineId}-${Date.now()}`,

          patientId:
            allocation.patientId,

          patientCode:
            allocation.patientCode,

          patientName:
            allocation.patientName,

          machineId:
            allocation.machineId,

          machineName:
            allocation.machineName,

          therapistId:
            assignedTherapist ? assignedTherapist.id : null,

          therapistName:
            assignedTherapist ? assignedTherapist.name : null,

          duration:
            allocation.duration,

          totalSeconds,

          remainingSeconds:
            totalSeconds,

          status:
            "RUNNING",

          startedAt:
            Date.now()

        };


        // -----------------------------------------------
        // ADD SESSION
        // -----------------------------------------------

        const updatedSessions = [

          ...activeSessionsRef.current,

          session

        ];


        activeSessionsRef.current =
          updatedSessions;

        setActiveSessions(
          updatedSessions
        );

        // Sync session with SQLite backend
        apiService.startSession(session);


        // -----------------------------------------------
        // UPDATE PATIENT
        // -----------------------------------------------

        const updatedPatients =
          patientListRef.current.map(
            (patient) => {

              if (
                patient.patientCode !==
                allocation.patientCode
              ) {

                return patient;

              }


              return {

                ...patient,

                status:
                  "IN_THERAPY",

                currentMachine:
                  allocation.machineId

              };

            }
          );


        patientListRef.current =
          updatedPatients;

        setPatientList(
          updatedPatients
        );


        // -----------------------------------------------
        // UPDATE MACHINE
        // -----------------------------------------------

        const updatedMachines =
          machineListRef.current.map(
            (machine) => {

              if (
                machine.id !==
                allocation.machineId
              ) {

                return machine;

              }


              return {

                ...machine,

                status:
                  "BUSY",

                currentPatient:
                  allocation.patientCode

              };

            }
          );


        machineListRef.current =
          updatedMachines;

        setMachineList(
          updatedMachines
        );


        // -----------------------------------------------
        // 🔔 SCHEDULED
        // -----------------------------------------------

        addNotification(

          "SCHEDULED",

          "Patient Scheduled",

          `${allocation.patientCode} — ${allocation.patientName} assigned to ${allocation.machineId} for ${allocation.duration} minutes.`

        );


        return true;

      },
      [
        addNotification
      ]
    );


  // =====================================================
  // RUN SCHEDULER
  // =====================================================

  const runSchedulingCycle =
    useCallback(
      () => {

        const allocations =
          runScheduler(
            patientListRef.current,
            machineListRef.current
          );


        if (
          allocations.length === 0
        ) {

          return [];

        }


        const usedPatients =
          new Set();

        const usedMachines =
          new Set();


        const safeAllocations =
          allocations.filter(
            (allocation) => {

              if (
                usedPatients.has(
                  allocation.patientCode
                )
              ) {

                return false;

              }


              if (
                usedMachines.has(
                  allocation.machineId
                )
              ) {

                return false;

              }


              if (
                activeSessionsRef.current.some(
                  (session) =>
                    session.patientCode ===
                    allocation.patientCode
                )
              ) {

                return false;

              }


              if (
                activeSessionsRef.current.some(
                  (session) =>
                    session.machineId ===
                    allocation.machineId
                )
              ) {

                return false;

              }


              usedPatients.add(
                allocation.patientCode
              );

              usedMachines.add(
                allocation.machineId
              );


              return true;

            }
          );


        safeAllocations.forEach(
          (allocation) => {

            startTherapySession(
              allocation
            );

          }
        );


        console.table(
          safeAllocations
        );


        return safeAllocations;

      },
      [
        startTherapySession
      ]
    );


  // =====================================================
  // COMPLETE THERAPY SESSION
  // =====================================================

  const completeTherapySession =
    useCallback(
      (
        session,
        early = false
      ) => {

        if (!session) {
          return;
        }


        const patient =
          patientListRef.current.find(
            (item) =>
              item.patientCode ===
              session.patientCode
          );


        if (!patient) {
          return;
        }


        // -----------------------------------------------
        // CALCULATE TIME
        // -----------------------------------------------

        const elapsedSeconds =
          session.totalSeconds -
          session.remainingSeconds;


        const elapsedMinutes =
          elapsedSeconds / 60;


        const savedMinutes =
          Math.max(
            0,
            session.duration -
            elapsedMinutes
          );


        // -----------------------------------------------
        // COMPLETED MACHINES
        // -----------------------------------------------

        const completedMachines = [

          ...(patient.completedMachines || [])

        ];


        if (
          !completedMachines.includes(
            session.machineId
          )
        ) {

          completedMachines.push(
            session.machineId
          );

        }


        // -----------------------------------------------
        // NEXT MACHINE
        // -----------------------------------------------

        const nextMachine =
          patient.requiredMachines.find(
            (machineId) =>
              !completedMachines.includes(
                machineId
              )
          ) || null;


        // -----------------------------------------------
        // UPDATE PATIENT
        // -----------------------------------------------

        const updatedPatients =
          patientListRef.current.map(
            (item) => {

              if (
                item.patientCode !==
                session.patientCode
              ) {

                return item;

              }


              return {

                ...item,

                completedMachines,

                currentMachine:
                  null,

                status:
                  nextMachine
                    ? "WAITING"
                    : "COMPLETED"

              };

            }
          );


        patientListRef.current =
          updatedPatients;

        setPatientList(
          updatedPatients
        );


        // -----------------------------------------------
        // FREE MACHINE
        // -----------------------------------------------

        const updatedMachines =
          machineListRef.current.map(
            (machine) => {

              if (
                machine.id !==
                session.machineId
              ) {

                return machine;

              }


              return {

                ...machine,

                status:
                  "AVAILABLE",

                currentPatient:
                  null

              };

            }
          );


        machineListRef.current =
          updatedMachines;

        setMachineList(
          updatedMachines
        );


        // -----------------------------------------------
        // FREE THERAPIST
        // -----------------------------------------------
        if (session.therapistId) {
          const updatedTherapists = therapistListRef.current.map((t) => {
            if (t.id !== session.therapistId) return t;
            return {
              ...t,
              status: "AVAILABLE",
              currentPatient: null,
              currentMachine: null,
              completedSessionsToday: (t.completedSessionsToday || 0) + 1
            };
          });
          therapistListRef.current = updatedTherapists;
          setTherapistList(updatedTherapists);
        }


        // -----------------------------------------------
        // REMOVE SESSION
        // -----------------------------------------------

        const remainingSessions =
          activeSessionsRef.current.filter(
            (item) =>
              item.id !==
              session.id
          );


        activeSessionsRef.current =
          remainingSessions;

        setActiveSessions(
          remainingSessions
        );


        setCompletedSessions(
          (count) =>
            count + 1
        );

        // Sync completion with SQLite backend
        apiService.completeSession(session.id, early, savedMinutes);


        // =================================================
        // 🔔 MACHINE AVAILABLE
        // =================================================

        addNotification(

          "INFO",

          "Machine Available",

          `${session.machineId} is now available for the next eligible patient.`

        );


        // =================================================
        // 🔔 EARLY COMPLETION
        // =================================================

        if (
          early &&
          savedMinutes > 0
        ) {

          setTimeReclaimed(
            (current) =>
              current + savedMinutes
          );


          addNotification(

            "EARLY",

            "Early Completion",

            `${session.patientCode} completed ${session.machineId} early. ${Math.round(savedMinutes)} minutes reclaimed.`

          );

        } else {

          addNotification(

            "COMPLETED",

            "Therapy Completed",

            `${session.patientCode} completed ${session.machineId}.`

          );

        }


        // =================================================
        // 🔔 NEXT MACHINE
        // =================================================

        if (nextMachine) {

          addNotification(

            "NEXT",

            "Next Therapy Required",

            `${session.patientCode} is waiting for ${nextMachine}.`

          );

        } else {

          addNotification(

            "COMPLETED",

            "Treatment Completed",

            `${session.patientCode} completed all required machines.`

          );

        }


        // =================================================
        // RUN SCHEDULER AGAIN
        // =================================================

        setTimeout(
          () => {

            runSchedulingCycle();

          },
          150
        );

      },
      [
        addNotification,
        runSchedulingCycle
      ]
    );


  // =====================================================
  // COMPLETE EARLY
  // =====================================================

  const completeEarly =
    useCallback(
      (sessionId) => {

        const session =
          activeSessionsRef.current.find(
            (item) =>
              item.id ===
              sessionId
          );


        if (!session) {
          return;
        }


        // Require at least one simulated minute
        if (
          session.remainingSeconds >
          session.totalSeconds - 60
        ) {

          addNotification(

            "INFO",

            "Session Still Starting",

            `${session.patientCode} has just started therapy. Allow at least one minute before early completion.`

          );

          return;

        }


        completeTherapySession(
          session,
          true
        );

      },
      [
        addNotification,
        completeTherapySession
      ]
    );


  // =====================================================
  // INITIAL SCHEDULER
  // =====================================================

  useEffect(() => {

    if (!isLoggedIn) {
      return;
    }


    if (
      schedulerStartedRef.current
    ) {

      return;

    }


    schedulerStartedRef.current =
      true;


    runSchedulingCycle();

  }, [
    isLoggedIn,
    runSchedulingCycle
  ]);


  // =====================================================
  // LIVE TIMER
  // =====================================================

  useEffect(() => {

    if (!isLoggedIn) {
      return;
    }


    const timer =
      setInterval(
        () => {

          const sessions =
            activeSessionsRef.current;


          if (
            sessions.length === 0
          ) {

            return;

          }


          const completed = [];


          const updated =
            sessions
              .map(
                (session) => {

                  const remaining =
                    session.remainingSeconds -
                    1;


                  if (
                    remaining <= 0
                  ) {

                    completed.push({

                      ...session,

                      remainingSeconds:
                        0

                    });


                    return null;

                  }


                  return {

                    ...session,

                    remainingSeconds:
                      remaining

                  };

                }
              )
              .filter(Boolean);


          activeSessionsRef.current =
            updated;

          setActiveSessions(
            updated
          );


          completed.forEach(
            (session) => {

              completeTherapySession(
                session,
                false
              );

            }
          );

        },
        1000
      );


    return () => {

      clearInterval(
        timer
      );

    };

  }, [
    isLoggedIn,
    completeTherapySession
  ]);


  // =====================================================
  // LOGIN
  // =====================================================

  if (!isLoggedIn) {

    return (

      <Login
        onLogin={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
          setTimeout(() => {
            runSchedulingCycle();
          }, 200);
        }}
      />

    );

  }


  // =====================================================
  // MAIN APPLICATION
  // =====================================================

  return (

    <div className="app">


      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={() => {
          setIsLoggedIn(false);
          setCurrentUser(null);
        }}
      />


      <main className="main">


        <header className="top-header">

          <span className="breadcrumb">
            PMR SCHEDULER
          </span>


          <div className="header-user">

            <div className="live-status">

              <span></span>

              SYSTEM ONLINE

            </div>


            <div className="user-profile">

              <div className="avatar">
                {currentUser?.avatar || "AD"}
              </div>


              <div>

                <strong>
                  {currentUser?.name || "Admin"}
                </strong>

                <small>
                  {currentUser?.role || "PMR Department"}
                </small>

              </div>

            </div>

            <button
              type="button"
              className="header-logout-btn"
              onClick={() => {
                setIsLoggedIn(false);
                setCurrentUser(null);
              }}
              title="Sign Out"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>

          </div>

        </header>


        <div className="page-content">


          {activePage ===
            "Dashboard" && (

            <Dashboard

              patients={
                patientList
              }

              machines={
                machineList
              }

              therapists={
                therapistList
              }

              activeSessions={
                activeSessions
              }

              notifications={
                notifications
              }

              timeReclaimed={
                timeReclaimed
              }

              completedSessions={
                completedSessions
              }

              onCompleteEarly={
                completeEarly
              }

            />

          )}


          {activePage ===
            "Patients" && (

            <Patients

              patients={
                patientList
              }

              setPatients={
                setPatientList
              }

              setActivePage={
                setActivePage
              }

            />

          )}


          {activePage ===
            "AddPatient" && (

            <AddPatient

              patients={
                patientList
              }

              setPatients={
                setPatientList
              }

              setActivePage={
                setActivePage
              }

            />

          )}

          {activePage === "Schedule" && (

  <Schedule
    patients={patientList}
    machines={machineList}
    therapists={therapistList}
    activeSessions={activeSessions}
  />

)}

{activePage === "Machines" && (

  <Machines
    machines={machineList}
    patients={patientList}
    therapists={therapistList}
    activeSessions={activeSessions}
  />

)}

{activePage === "Therapists" && (

  <Therapists
    therapists={therapistList}
    setTherapists={setTherapistList}
    patients={patientList}
    machines={machineList}
    activeSessions={activeSessions}
  />

)}

{activePage === "Settings" && (

  <Settings
    currentUser={currentUser}
    onLogout={() => {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }}
    onResetScheduler={async () => {
      await apiService.resetData();
      try {
        const [dbPatients, dbMachines, dbTherapists] = await Promise.all([
          apiService.getPatients(),
          apiService.getMachines(),
          apiService.getTherapists()
        ]);
        if (dbPatients && Array.isArray(dbPatients) && dbPatients.length > 0) {
          setPatientList(dbPatients);
          patientListRef.current = dbPatients;
        } else {
          setPatientList(initialPatients);
        }
        if (dbMachines && Array.isArray(dbMachines) && dbMachines.length > 0) {
          setMachineList(dbMachines);
          machineListRef.current = dbMachines;
        } else {
          setMachineList(initialMachines);
        }
        if (dbTherapists && Array.isArray(dbTherapists) && dbTherapists.length > 0) {
          setTherapistList(dbTherapists);
          therapistListRef.current = dbTherapists;
        } else {
          setTherapistList(initialTherapists);
        }
      } catch (err) {
        console.warn("Could not reload database records:", err);
      }
      setActiveSessions([]);
      activeSessionsRef.current = [];
      setTimeReclaimed(0);
      setCompletedSessions(0);
      setTimeout(() => {
        runSchedulingCycle();
      }, 250);
    }}
  />

)}

        </div>

      </main>

    </div>

  );
}


export default App;