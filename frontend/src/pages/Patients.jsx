import { useMemo, useState } from "react";

import {
  Search,
  UserRound,
  ChevronRight,
  Route,
  CheckCircle2,
  Clock3,
  Activity,
  Building2,
  BedDouble,
  Trash2,
  Download
} from "lucide-react";
import { apiService } from "../api/apiService";

function Patients({
  patients = [],
  setPatients,
  setActivePage
}) {

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedSetting, setSelectedSetting] =
    useState("ALL"); // "ALL" | "DEPARTMENT" | "WARD"


  // =====================================================
  // COUNTS BY RATIO SETTING
  // =====================================================

  const deptCount = useMemo(() => {
    return patients.filter((p) => p.careSetting === "DEPARTMENT" || (!p.careSetting && !p.wardInfo)).length;
  }, [patients]);

  const wardCount = useMemo(() => {
    return patients.filter((p) => p.careSetting === "WARD" || Boolean(p.wardInfo)).length;
  }, [patients]);


  // =====================================================
  // FILTER PATIENTS
  // =====================================================

  const filteredPatients =
    useMemo(() => {

      const search =
        searchTerm
          .trim()
          .toLowerCase();

      return patients.filter((patient) => {
        // Setting filter
        const isWard = patient.careSetting === "WARD" || Boolean(patient.wardInfo);
        if (selectedSetting === "DEPARTMENT" && isWard) return false;
        if (selectedSetting === "WARD" && !isWard) return false;

        if (!search) return true;

        return (
          patient.name?.toLowerCase().includes(search) ||
          patient.patientCode?.toLowerCase().includes(search) ||
          patient.condition?.toLowerCase().includes(search) ||
          patient.routingMode?.toLowerCase().includes(search) ||
          patient.wardInfo?.toLowerCase().includes(search) ||
          patient.requiredMachines?.join(" ").toLowerCase().includes(search)
        );
      });

    }, [
      patients,
      searchTerm,
      selectedSetting
    ]);


  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass =
    (status) => {

      if (
        status === "IN_THERAPY"
      ) {
        return "in-therapy";
      }

      if (
        status === "COMPLETED"
      ) {
        return "completed";
      }

      if (
        status === "SCHEDULED"
      ) {
        return "scheduled";
      }

      return "waiting";

    };


  // =====================================================
  // STATUS LABEL
  // =====================================================

  const getStatusLabel =
    (status) => {

      if (
        status === "IN_THERAPY"
      ) {
        return "IN THERAPY";
      }

      if (
        status === "COMPLETED"
      ) {
        return "COMPLETED";
      }

      if (
        status === "SCHEDULED"
      ) {
        return "SCHEDULED";
      }

      return "WAITING";

    };


  // =====================================================
  // ROUTE PROGRESS
  // =====================================================

  const getRouteProgress =
    (patient) => {

      const required =
        patient.requiredMachines ||
        [];

      const completed =
        patient.completedMachines ||
        [];


      if (
        required.length === 0
      ) {

        return [];

      }


      return required.map(
        (machineId) => ({

          machineId,

          completed:
            completed.includes(
              machineId
            )

        })
      );

    };


  // =====================================================
  // PATIENT COUNT
  // =====================================================

  const totalPatients =
    patients.length;


  const waitingCount =
    patients.filter(
      (patient) =>
        patient.status ===
        "WAITING"
    ).length;


  const therapyCount =
    patients.filter(
      (patient) =>
        patient.status ===
        "IN_THERAPY"
    ).length;


  const completedCount =
    patients.filter(
      (patient) =>
        patient.status ===
        "COMPLETED"
    ).length;


  return (

    <div className="patients-page">


      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="patients-page-header">

        <div>

          <span className="page-label">
            PATIENT MANAGEMENT
          </span>

          <h1>
            Registered Patients
          </h1>

          <p>
            View patient details, therapy routes
            and current rehabilitation status.
          </p>

        </div>


        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {patients.length > 0 && (
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                background: "rgba(220, 38, 38, 0.08)",
                color: "#dc2626",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
              onClick={async () => {
                if (window.confirm("Are you sure you want to clear all patients from the active queue?")) {
                  await apiService.clearAllPatients();
                  if (setPatients) setPatients([]);
                }
              }}
            >
              <Trash2 size={15} />
              Clear Queue
            </button>
          )}

          <a
            href={apiService.getPatientsExportUrl()}
            download
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(37, 99, 235, 0.3)",
              background: "rgba(37, 99, 235, 0.08)",
              color: "#2563eb",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              textDecoration: "none"
            }}
            title="Download all registered patients as Excel-compatible CSV file"
          >
            <Download size={15} />
            Export CSV
          </a>

          <button
            className="primary-button"
            onClick={() =>
              setActivePage &&
              setActivePage(
                "AddPatient"
              )
            }
          >
            <UserRound size={15} />
            Add Patient
          </button>
        </div>

      </div>


      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="patient-summary">

        <SummaryCard
          icon={<UserRound size={17} />}
          label="Total Patients"
          value={totalPatients}
        />


        <SummaryCard
          icon={<Clock3 size={17} />}
          label="Waiting"
          value={waitingCount}
        />


        <SummaryCard
          icon={<Activity size={17} />}
          label="In Therapy"
          value={therapyCount}
        />


        <SummaryCard
          icon={<CheckCircle2 size={17} />}
          label="Completed"
          value={completedCount}
        />

      </div>


      {/* =================================================
          PATIENT TABLE
      ================================================= */}

      <div className="patients-card">


        {/* =================================================
            TABLE HEADER
        ================================================= */}

        <div className="patients-card-header">

          <div>

            <h2>
              Registered Patients
            </h2>

            <span>
              {totalPatients} patients in today's system
            </span>

          </div>


          {/* SEARCH */}

          <div className="patient-search">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search patient, ID, condition or machine..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

          </div>

        </div>

        {/* CLINICAL SETTING & RATIO FILTER TABS */}
        <div style={{ display: "flex", gap: "8px", padding: "10px 20px", borderBottom: "1px solid var(--border-color)", background: "rgba(0,0,0,0.02)", flexWrap: "wrap" }}>
          <button
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              border: selectedSetting === "ALL" ? "none" : "1px solid var(--border-color)",
              background: selectedSetting === "ALL" ? "#0284c7" : "transparent",
              color: selectedSetting === "ALL" ? "#ffffff" : "var(--text-secondary)"
            }}
            onClick={() => setSelectedSetting("ALL")}
          >
            All Patients ({patients.length})
          </button>
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              border: selectedSetting === "DEPARTMENT" ? "none" : "1px solid var(--border-color)",
              background: selectedSetting === "DEPARTMENT" ? "#0284c7" : "transparent",
              color: selectedSetting === "DEPARTMENT" ? "#ffffff" : "var(--text-secondary)"
            }}
            onClick={() => setSelectedSetting("DEPARTMENT")}
          >
            <Building2 size={14} />
            🏢 In-Department ({deptCount})
          </button>
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              border: selectedSetting === "WARD" ? "none" : "1px solid var(--border-color)",
              background: selectedSetting === "WARD" ? "#059669" : "transparent",
              color: selectedSetting === "WARD" ? "#ffffff" : "var(--text-secondary)"
            }}
            onClick={() => setSelectedSetting("WARD")}
          >
            <BedDouble size={14} />
            🛏️ In-Ward Bedside ({wardCount})
          </button>
        </div>


        {/* =================================================
            TABLE
        ================================================= */}

        <div className="patients-table-wrapper">

          <table className="patients-table">

            <thead>

              <tr>

                <th>
                  IDENTIFICATION
                </th>

                <th>
                  PATIENT
                </th>

                <th>
                  AGE
                </th>

                <th>
                  CONDITION
                </th>

                <th>
                  ROUTING
                </th>

                <th>
                  THERAPY ROUTE
                </th>

                <th>
                  STATUS
                </th>

                <th></th>

              </tr>

            </thead>


            <tbody>

              {filteredPatients.map(
                (patient) => {

                  const route =
                    getRouteProgress(
                      patient
                    );


                  return (

                    <tr
                      key={
                        patient.id
                      }
                    >


                      {/* =================================
                          ID
                      ================================= */}

                      <td>

                        <span className="patient-code">
                          {patient.patientCode}
                        </span>

                      </td>


                      {/* =================================
                          PATIENT
                      ================================= */}

                      <td>

                        <div className="patient-name-cell">

                          <div className="patient-avatar">

                            <UserRound
                              size={15}
                            />

                          </div>


                          <div>

                            <strong>
                              {patient.name}
                            </strong>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "3px" }}>
                              <small>
                                ID: {patient.patientCode}
                              </small>

                              {patient.careSetting === "WARD" || patient.wardInfo ? (
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  fontSize: "0.68rem",
                                  fontWeight: "600",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(5, 150, 105, 0.12)",
                                  color: "#059669"
                                }}>
                                  <BedDouble size={10} />
                                  {patient.wardInfo || "In-Ward"} · {patient.trainingDuration || 40}m
                                </span>
                              ) : (
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  fontSize: "0.68rem",
                                  fontWeight: "600",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(2, 132, 199, 0.12)",
                                  color: "#0284c7"
                                }}>
                                  <Building2 size={10} />
                                  In-Department · {patient.trainingDuration || 60}m
                                </span>
                              )}
                            </div>

                          </div>

                        </div>

                      </td>


                      {/* =================================
                          AGE
                      ================================= */}

                      <td>

                        <span className="patient-age">
                          {patient.age}
                        </span>

                      </td>


                      {/* =================================
                          CONDITION
                      ================================= */}

                      <td>

                        <span className="patient-condition">
                          {patient.condition}
                        </span>

                      </td>


                      {/* =================================
                          ROUTING MODE
                      ================================= */}

                      <td>

                        <span
                          className={
                            `routing-badge ${
                              patient.routingMode
                                ?.toLowerCase()
                            }`
                          }
                        >

                          {patient.routingMode}

                        </span>

                      </td>


                      {/* =================================
                          THERAPY ROUTE
                      ================================= */}

                      <td>

                        <div className="therapy-route-cell">

                          <Route
                            size={14}
                          />


                          <div className="therapy-route">

                            {route.map(
                              (
                                item,
                                index
                              ) => (

                                <div
                                  className="therapy-route-step"
                                  key={
                                    item.machineId
                                  }
                                >

                                  <span
                                    className={
                                      item.completed
                                        ? "machine-route completed"
                                        : "machine-route"
                                    }
                                  >

                                    {item.completed && (
                                      <CheckCircle2
                                        size={10}
                                      />
                                    )}

                                    {item.machineId}

                                  </span>


                                  {index <
                                    route.length -
                                      1 && (

                                    <span className="route-arrow">
                                      →
                                    </span>

                                  )}

                                </div>

                              )
                            )}

                          </div>

                        </div>

                      </td>


                      {/* =================================
                          STATUS
                      ================================= */}

                      <td>

                        <span
                          className={
                            `patient-status ${getStatusClass(
                              patient.status
                            )}`
                          }
                        >

                          <span></span>

                          {getStatusLabel(
                            patient.status
                          )}

                        </span>

                      </td>


                      {/* =================================
                          DETAILS ARROW
                      ================================= */}

                      <td>

                        <button
                          className="patient-row-arrow"
                          title="View patient"
                        >

                          <ChevronRight
                            size={17}
                          />

                        </button>

                      </td>

                    </tr>

                  );

                }
              )}


              {/* =========================================
                  NO RESULTS
              ========================================= */}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="8" className="patients-empty" style={{ padding: "3rem 1rem", textAlign: "center" }}>
                    <UserRound size={32} style={{ color: "var(--text-secondary)", marginBottom: "8px" }} />
                    <strong style={{ display: "block", fontSize: "1.05rem", marginBottom: "4px" }}>
                      {patients.length === 0 ? "Patient Queue is Empty" : "No matching patients found"}
                    </strong>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {patients.length === 0
                        ? "Click 'Add Patient' above to register your first patient into the clinic queue."
                        : "Try another search term or change your ratio filter."}
                    </span>
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  label,
  value
}) {

  return (

    <div className="patient-summary-card">

      <div className="patient-summary-icon">

        {icon}

      </div>


      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>

  );
}


export default Patients;