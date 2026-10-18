import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Activity,
  Users,
  Clock3,
  Wrench,
  CheckCircle2,
  Bell,
  Zap,
  ArrowRight,
  TimerReset,
  AlertCircle,
  X,
  UserCheck,
  Monitor,
  CalendarCheck,
  Building2,
  BedDouble,
  ShieldCheck
} from "lucide-react";


function Dashboard({
  patients = [],
  machines = [],
  therapists = [],
  activeSessions = [],
  notifications = [],
  timeReclaimed = 0,
  completedSessions = 0,
  onCompleteEarly
}) {

  // =====================================================
  // TOAST STATE
  // =====================================================

  const [toast, setToast] = useState(null);

  const latestNotificationId =
    useRef(null);


  // =====================================================
  // SHOW ONLY NEW NOTIFICATIONS AS POPUPS
  // =====================================================

  useEffect(() => {

    if (
      notifications.length === 0
    ) {
      return;
    }


    const latest =
      notifications[0];


    // First load:
    // don't show old notifications as popups.
    if (
      latestNotificationId.current === null
    ) {

      latestNotificationId.current =
        latest.id;

      return;

    }


    // Same notification:
    // don't show it again.
    if (
      latest.id ===
      latestNotificationId.current
    ) {
      return;
    }


    // New notification
    latestNotificationId.current =
      latest.id;


    setToast(latest);


    // Automatically hide popup
    // after 6 seconds.

    const timer =
      setTimeout(
        () => {

          setToast(null);

        },
        6000
      );


    return () => {
      clearTimeout(timer);
    };

  }, [notifications]);


  // =====================================================
  // MACHINE COUNTS
  // =====================================================

  const availableMachines =
    machines.filter(
      (machine) =>
        machine.status ===
        "AVAILABLE"
    ).length;


  const busyMachines =
    machines.filter(
      (machine) =>
        machine.status ===
        "BUSY"
    ).length;


  const maintenanceMachines =
    machines.filter(
      (machine) =>
        machine.status ===
        "MAINTENANCE"
    ).length;


  // =====================================================
  // PATIENT COUNTS
  // =====================================================

  const waitingPatients =
    patients.filter(
      (patient) =>
        patient.status ===
        "WAITING"
    ).length;


  const therapyPatients =
    patients.filter(
      (patient) =>
        patient.status ===
        "IN_THERAPY"
    ).length;


  // =====================================================
  // THERAPIST COUNTS
  // =====================================================

  const assignedTherapists =
    therapists.filter(
      (therapist) =>
        therapist.status === "IN_SESSION" ||
        activeSessions.some(
          (s) =>
            s.therapistId === therapist.id ||
            s.therapistName === therapist.name
        )
    );

  const assignedTherapistsCount =
    assignedTherapists.length;

  const totalTherapists =
    therapists.length || 50;




  // =====================================================
  // TIMER
  // =====================================================

  const formatTime =
    (totalSeconds = 0) => {

      const minutes =
        Math.floor(
          totalSeconds / 60
        );

      const seconds =
        totalSeconds % 60;


      return `${String(
        minutes
      ).padStart(
        2,
        "0"
      )}:${String(
        seconds
      ).padStart(
        2,
        "0"
      )}`;

    };


  // =====================================================
  // NOTIFICATION TIME
  // =====================================================

  const formatNotificationTime =
    (date) => {

      if (!date) {
        return "--:--";
      }


      return new Date(
        date
      ).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );

    };


  // =====================================================
  // PRIORITY
  // =====================================================

  const getPriority =
    (patient) => {

      let score = 0;


      score +=
        patient.id <= 10
          ? 30
          : 10;


      if (
        patient.routingMode ===
        "STRICT"
      ) {
        score += 20;
      }


      if (
        patient.requiredMachines &&
        patient.requiredMachines.length >= 3
      ) {
        score += 10;
      }


      if (
        patient.age >= 60
      ) {
        score += 10;
      }


      return score;

    };


  // =====================================================
  // WAITING QUEUE
  // =====================================================

  const waitingQueue =
    patients
      .filter(
        (patient) =>
          patient.status ===
          "WAITING"
      )
      .map(
        (patient) => ({
          ...patient,
          priorityScore:
            getPriority(patient)
        })
      )
      .sort(
        (a, b) =>
          b.priorityScore -
          a.priorityScore
      );


  return (

    <div className="dashboard-page">


      {/* =================================================
          SINGLE POPUP
      ================================================= */}

      {toast && (

        <div className="toast-container">

          <NotificationToast
            notification={toast}
            onDismiss={() =>
              setToast(null)
            }
          />

        </div>

      )}


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="dashboard-header">

        <div>

          <span className="page-label">
            CLINICAL OPERATIONS
          </span>

          <h1>
            PMR Resource Control Center
          </h1>

          <p>
            Real-time rehabilitation machine
            allocation and dynamic scheduling.
          </p>

        </div>


        <div className="dashboard-live">

          <span></span>

          LIVE SCHEDULER

        </div>

      </div>


      {/* =================================================
          KPI
      ================================================= */}

      <div className="dashboard-kpis">

        <KpiCard
          icon={<Users size={19} />}
          title="Total Patients"
          value={patients.length}
          subtitle="Registered today"
        />


        <KpiCard
          icon={<Clock3 size={19} />}
          title="Waiting Queue"
          value={waitingPatients}
          subtitle="Awaiting allocation"
        />


        <KpiCard
          icon={<Activity size={19} />}
          title="In Therapy"
          value={therapyPatients}
          subtitle="Active treatment"
        />


        {/* ALLOCATED CARD */}
        <KpiCard
          icon={<Monitor size={19} />}
          title="Allocated Machines"
          value={`${busyMachines}/${machines.length}`}
          subtitle={`${availableMachines} systems free`}
          highlight="allocated"
        />


        {/* ASSIGNED CARD */}
        <KpiCard
          icon={<UserCheck size={19} />}
          title="Assigned Clinicians"
          value={`${assignedTherapistsCount}/${totalTherapists}`}
          subtitle={`${totalTherapists - assignedTherapistsCount} available on duty`}
          highlight="assigned"
        />


        <KpiCard
          icon={<CheckCircle2 size={19} />}
          title="Completed Sessions"
          value={completedSessions}
          subtitle="Therapies completed"
        />


        <KpiCard
          icon={<Zap size={19} />}
          title="Time Reclaimed"
          value={`${Math.round(
            timeReclaimed
          )} min`}
          subtitle="From early completion"
        />


        <KpiCard
          icon={<CalendarCheck size={19} />}
          title="Total Equipments"
          value={`${machines.length} Units`}
          subtitle="Institute inventory"
        />

      </div>




      {/* =================================================
          MACHINE OPERATIONS
      ================================================= */}

      <div className="machine-section">

        <div className="section-heading">

          <div>

            <h2>
              Machine Operations
            </h2>

            <span>
              Live status of all rehabilitation
              equipment
            </span>

          </div>


          <div className="machine-summary">

            <span>
              <i className="dot available"></i>
              {availableMachines} Available
            </span>


            <span>
              <i className="dot busy"></i>
              {busyMachines} In Use
            </span>


            <span>
              <i className="dot maintenance"></i>
              {maintenanceMachines} Maintenance
            </span>

          </div>

        </div>


        <div className="machine-grid">

          {machines.map(
            (machine) => {

              const session =
                activeSessions.find(
                  (item) =>
                    item.machineId ===
                    machine.id
                );


              const patient =
                session
                  ? patients.find(
                      (item) =>
                        item.patientCode ===
                        session.patientCode
                    )
                  : null;


              return (

                <MachineCard
                  key={machine.id}
                  machine={machine}
                  session={session}
                  patient={patient}
                  formatTime={formatTime}
                  onCompleteEarly={
                    onCompleteEarly
                  }
                />

              );

            }
          )}

        </div>

      </div>


      {/* =================================================
          LIVE ALLOCATIONS & CLINICIAN ASSIGNMENTS SECTION
      ================================================= */}
      <div className="dashboard-allocations-assigned-grid">

        {/* ALLOCATED SESSIONS CARD */}
        <div className="dashboard-panel allocated-panel">

          <div className="panel-heading">

            <div className="panel-title-with-badge">

              <div className="panel-icon-wrap allocated">
                <Monitor size={18} />
              </div>

              <div>
                <h2>Allocated Equipment Sessions</h2>
                <span>Live patient-to-machine allocations & real-time timers</span>
              </div>

            </div>

            <span className="live-pill allocated">
              <span className="pulse-dot"></span>
              {activeSessions.length} Allocated
            </span>

          </div>


          <div className="allocated-sessions-list">

            {activeSessions.map((session) => {
              const patient = patients.find(
                (p) => p.patientCode === session.patientCode
              );

              return (
                <div className="allocated-session-row" key={session.id}>

                  <div className="allocated-machine-badge">
                    <strong>{session.machineId}</strong>
                    <span>{session.machineName}</span>
                  </div>

                  <div className="allocated-patient-meta">
                    <strong>
                      {session.patientCode} — {patient?.name || session.patientName}
                    </strong>
                    <small>
                      {patient?.condition || "Prescribed Rehabilitation"}
                    </small>
                  </div>

                  <div className="allocated-therapist-meta">
                    {session.therapistName ? (
                      <>
                        <UserCheck size={13} />
                        <span>{session.therapistName}</span>
                      </>
                    ) : (
                      <span className="auto-assigned-text">
                        Dynamic Specialist
                      </span>
                    )}
                  </div>

                  <div className="allocated-timer-meta">
                    <span className="timer-text">
                      {formatTime(session.remainingSeconds)}
                    </span>
                    <small>{session.duration} min duration</small>
                  </div>

                  <button
                    className="early-complete-small-btn"
                    title="Complete Session Early"
                    onClick={() =>
                      onCompleteEarly && onCompleteEarly(session.id)
                    }
                  >
                    Early Complete
                  </button>

                </div>
              );
            })}

            {activeSessions.length === 0 && (
              <div className="panel-empty-state">
                <CheckCircle2 size={24} />
                <strong>All Equipments Available</strong>
                <span>
                  No active allocations currently running. Eligible patients will be scheduled automatically.
                </span>
              </div>
            )}

          </div>

        </div>


        {/* ASSIGNED CLINICIANS CARD */}
        <div className="dashboard-panel assigned-panel">

          <div className="panel-heading">

            <div className="panel-title-with-badge">

              <div className="panel-icon-wrap assigned">
                <UserCheck size={18} />
              </div>

              <div>
                <h2>Assigned Clinicians Roster</h2>
                <span>Therapists actively treating patients in session</span>
              </div>

            </div>

            <span className="live-pill assigned">
              <span className="pulse-dot"></span>
              {assignedTherapistsCount} Assigned
            </span>

          </div>


          <div className="assigned-clinicians-list">

            {assignedTherapists.map((therapist) => {
              const activeSession = activeSessions.find(
                (s) =>
                  s.therapistId === therapist.id ||
                  s.therapistName === therapist.name
              );

              return (
                <div className="assigned-clinician-row" key={therapist.id}>

                  <div
                    className="clinician-avatar"
                    style={{
                      backgroundColor: therapist.avatarColor || "#0284c7"
                    }}
                  >
                    {therapist.name
                      .replace(/^(Mr\.|Mrs\.|Ms\.)\s*/i, "")
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="clinician-name-meta">
                    <strong>{therapist.name}</strong>
                    <span className="clinician-role-pill">
                      {therapist.designation}
                    </span>
                  </div>

                  <div className="clinician-assignment-meta">
                    {activeSession ? (
                      <>
                        <span className="assigned-to-label">TREATING</span>
                        <strong>
                          {activeSession.patientCode} • {activeSession.machineName}
                        </strong>
                      </>
                    ) : therapist.currentPatient ? (
                      <>
                        <span className="assigned-to-label">ASSIGNED TO</span>
                        <strong>{therapist.currentPatient}</strong>
                      </>
                    ) : (
                      <span className="on-duty-text">
                        On Active Clinical Duty
                      </span>
                    )}
                  </div>

                  <div className="clinician-status-badge">
                    <span className="pulse-dot green"></span>
                    <span>ACTIVE</span>
                  </div>

                </div>
              );
            })}

            {assignedTherapists.length === 0 && (
              <div className="panel-empty-state">
                <UserCheck size={24} />
                <strong>All 50 Clinicians On Duty & Available</strong>
                <span>
                  Therapists will be automatically assigned to patient sessions when scheduled.
                </span>
              </div>
            )}

          </div>

        </div>

      </div>


      {/* =================================================
          LOWER SECTION
      ================================================= */}

      <div className="dashboard-lower">


        {/* =================================================
            PRIORITY QUEUE
        ================================================= */}

        <div className="dashboard-panel">

          <div className="panel-heading">

            <div>

              <h2>
                Dynamic Priority Queue
              </h2>

              <span>
                Scheduler-ranked patients awaiting allocation
              </span>

            </div>

            <Activity size={18} />

          </div>


          <div className="priority-queue">

            {waitingQueue
              .slice(0, 8)
              .map(
                (
                  patient,
                  index
                ) => (

                  <PriorityQueueRow
                    key={
                      patient.id
                    }
                    patient={
                      patient
                    }
                    position={
                      index + 1
                    }
                  />

                )
              )}


            {waitingQueue.length ===
              0 && (

              <div className="empty-queue">

                <CheckCircle2 size={20} />

                <span>
                  No patients waiting for allocation.
                </span>

              </div>

            )}

          </div>

        </div>


        {/* =================================================
            LIVE ACTIVITY
        ================================================= */}

        <div className="dashboard-panel">

          <div className="panel-heading">

            <div>

              <h2>
                Live Activity
              </h2>

              <span>
                Scheduler events and notifications
              </span>

            </div>

            <Bell size={18} />

          </div>


          <div className="notification-list">

            {notifications.length ===
              0 && (

              <div className="notification-empty">

                <Activity size={20} />

                <span>
                  Waiting for scheduler events...
                </span>

              </div>

            )}


            {notifications
              .slice(0, 8)
              .map(
                (
                  notification
                ) => (

                  <NotificationItem
                    key={
                      notification.id
                    }
                    notification={
                      notification
                    }
                    time={
                      formatNotificationTime(
                        notification.time
                      )
                    }
                  />

                )
              )}

          </div>

        </div>

      </div>


      {/* =================================================
          PERFORMANCE
      ================================================= */}

      <div className="scheduler-overview">

        <div className="scheduler-overview-header">

          <div>

            <span className="page-label">
              SYSTEM MONITORING
            </span>

            <h2>
              Scheduler Performance
            </h2>

          </div>


          <div className="scheduler-running">

            <span></span>

            ENGINE ACTIVE

          </div>

        </div>


        <div className="scheduler-metrics">

          <Metric
            label="Active Sessions"
            value={
              activeSessions.length
            }
          />


          <Metric
            label="Waiting Patients"
            value={
              waitingPatients
            }
          />


          <Metric
            label="Completed Sessions"
            value={
              completedSessions
            }
          />


          <Metric
            label="Time Reclaimed"
            value={`${Math.round(
              timeReclaimed
            )} min`}
          />

        </div>

      </div>

    </div>

  );
}


/* =========================================================
   KPI
========================================================= */

function KpiCard({
  icon,
  title,
  value,
  subtitle,
  highlight
}) {

  return (

    <div
      className={
        `dashboard-kpi ${
          highlight ? `kpi-${highlight}` : ""
        }`
      }
    >

      <div
        className={
          `kpi-icon ${
            highlight ? `icon-${highlight}` : ""
          }`
        }
      >
        {icon}
      </div>


      <div>

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {subtitle}
        </small>

      </div>

    </div>

  );
}


/* =========================================================
   MACHINE CARD
========================================================= */

function MachineCard({
  machine,
  session,
  patient,
  formatTime,
  onCompleteEarly
}) {

  const isBusy =
    machine.status ===
    "BUSY";


  const isMaintenance =
    machine.status ===
    "MAINTENANCE";


  let progress = 0;


  if (session) {

    progress =
      (
        session.remainingSeconds /
        session.totalSeconds
      ) * 100;

  }


  return (

    <div
      className={
        `live-machine-card ${
          isBusy
            ? "machine-busy"
            : ""
        } ${
          isMaintenance
            ? "machine-maintenance"
            : ""
        }`
      }
    >

      <div className="machine-card-header">

        <div>

          <strong>
            {machine.id}
          </strong>

          <span>
            {machine.type}
          </span>

        </div>


        <span
          className={
            `machine-live-status ${
              isBusy
                ? "busy"
                : isMaintenance
                ? "maintenance"
                : "available"
            }`
          }
        >

          <i></i>

          {isBusy
            ? "IN USE"
            : isMaintenance
            ? "MAINTENANCE"
            : "AVAILABLE"}

        </span>

      </div>


      <div className="machine-card-name">
        {machine.name}
      </div>


      {isBusy && session ? (

        <div className="active-machine-patient">

          <div className="active-patient-avatar">
            <Users size={15} />
          </div>


          <div>

            <span>
              CURRENT PATIENT
            </span>

            <strong>
              {session.patientCode}
            </strong>

            <small>
              {patient?.name ||
                session.patientName}
            </small>

            {session.therapistName && (
              <span className="machine-assigned-clinician">
                <UserCheck size={12} />
                {session.therapistName}
              </span>
            )}

          </div>

        </div>

      ) : isMaintenance ? (

        <div className="machine-idle-state">

          <Wrench size={18} />

          <span>
            Equipment under maintenance
          </span>

        </div>

      ) : (

        <div className="machine-idle-state">

          <CheckCircle2 size={18} />

          <span>
            Ready for next patient
          </span>

        </div>

      )}


      {isBusy && session && (

        <div className="machine-session">

          <div className="session-time">

            <span>
              REMAINING
            </span>

            <strong>
              {formatTime(
                session.remainingSeconds
              )}
            </strong>

          </div>


          <div className="session-progress">

            <div
              style={{
                width:
                  `${Math.max(
                    0,
                    progress
                  )}%`
              }}
            ></div>

          </div>


          <button
            className="complete-early-button"
            onClick={() =>
              onCompleteEarly(
                session.id
              )
            }
          >

            <TimerReset size={13} />

            Complete Early

          </button>

        </div>

      )}

    </div>

  );
}


/* =========================================================
   PRIORITY ROW
========================================================= */

function PriorityQueueRow({
  patient,
  position
}) {

  const priorityLevel =
    patient.priorityScore >= 50
      ? "HIGH"
      : patient.priorityScore >= 30
      ? "MEDIUM"
      : "NORMAL";


  return (

    <div className="priority-row">

      <div className="priority-position">
        {String(
          position
        ).padStart(
          2,
          "0"
        )}
      </div>


      <div className="priority-patient">

        <div className="priority-avatar">

          {patient.patientCode.replace(
            "P",
            ""
          )}

        </div>


        <div>

          <strong>
            {patient.name}
          </strong>

          <small>

            {patient.patientCode}

            {" • "}

            {patient.condition}

          </small>

        </div>

      </div>


      <div className="priority-route">

        <span
          className={
            `routing-badge ${
              patient.routingMode.toLowerCase()
            }`
          }
        >
          {patient.routingMode}
        </span>

      </div>


      <div
        className={
          `priority-level ${
            priorityLevel.toLowerCase()
          }`
        }
      >

        {priorityLevel}

      </div>

    </div>

  );
}


/* =========================================================
   SINGLE TOAST
========================================================= */

function NotificationToast({
  notification,
  onDismiss
}) {

  const type =
    notification.type?.toLowerCase() ||
    "scheduled";


  const icon =
    type === "early"
      ? <Zap size={17} />
      : type === "completed"
      ? <CheckCircle2 size={17} />
      : type === "next"
      ? <ArrowRight size={17} />
      : type === "info"
      ? <AlertCircle size={17} />
      : <Bell size={17} />;


  return (

    <div
      className={
        `toast-notification toast-${type}`
      }
    >

      <div className="toast-icon">
        {icon}
      </div>


      <div className="toast-content">

        <strong>
          {notification.title}
        </strong>

        <p>
          {notification.message}
        </p>

      </div>


      <button
        type="button"
        className="toast-close"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >

        <X size={15} />

      </button>

    </div>

  );
}


/* =========================================================
   LIVE ACTIVITY
========================================================= */

function NotificationItem({
  notification,
  time
}) {

  const icon =
    notification.type === "EARLY"
      ? <Zap size={14} />
      : notification.type === "COMPLETED"
      ? <CheckCircle2 size={14} />
      : notification.type === "NEXT"
      ? <ArrowRight size={14} />
      : <Bell size={14} />;


  return (

    <div
      className={
        `notification-item notification-${
          notification.type.toLowerCase()
        }`
      }
    >

      <div className="notification-icon">
        {icon}
      </div>


      <div className="notification-content">

        <strong>
          {notification.title}
        </strong>

        <p>
          {notification.message}
        </p>

        <small>
          {time}
        </small>

      </div>

    </div>

  );
}


/* =========================================================
   METRIC
========================================================= */

function Metric({
  label,
  value
}) {

  return (

    <div className="scheduler-metric">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>

  );
}


export default Dashboard;