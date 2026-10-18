import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  Users,
  Activity,
  UserCheck,
  Search,
  Building2,
  BedDouble,
  ShieldCheck
} from "lucide-react";

function Schedule({
  patients = [],
  activeSessions = [],
  machines = [],
  therapists = []
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [careSettingFilter, setCareSettingFilter] = useState("ALL");

  const scheduledPatients = patients.filter(
    (patient) =>
      patient.status === "WAITING" ||
      patient.status === "IN_THERAPY" ||
      patient.status === "COMPLETED"
  );

  const deptScheduledCount = scheduledPatients.filter(
    (p) => p.careSetting === "DEPARTMENT" || (!p.careSetting && !p.wardInfo)
  ).length;

  const wardScheduledCount = scheduledPatients.filter(
    (p) => p.careSetting === "WARD" || Boolean(p.wardInfo)
  ).length;

  const getPatientSession = (patientCode) =>
    activeSessions.find((session) => session.patientCode === patientCode);

  const getTherapist = (therapistId, therapistName) => {
    if (therapistId) {
      const found = therapists.find((t) => t.id === therapistId);
      if (found) return found;
    }
    if (therapistName) {
      const found = therapists.find((t) => t.name === therapistName);
      if (found) return found;
    }
    return null;
  };

  const formatTime = (seconds = 0) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const filteredPatients = scheduledPatients.filter((p) => {
    // Care setting filter
    const isWard = p.careSetting === "WARD" || Boolean(p.wardInfo);
    if (careSettingFilter === "DEPARTMENT" && isWard) return false;
    if (careSettingFilter === "WARD" && !isWard) return false;

    // Status filter
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const session = getPatientSession(p.patientCode);
      const matchesName = p.name.toLowerCase().includes(query);
      const matchesCode = p.patientCode.toLowerCase().includes(query);
      const matchesTherapist = session?.therapistName?.toLowerCase().includes(query);
      const matchesMachine = session?.machineName?.toLowerCase().includes(query);
      const matchesWard = p.wardInfo?.toLowerCase().includes(query);
      return matchesName || matchesCode || matchesTherapist || matchesMachine || matchesWard;
    }
    return true;
  });

  return (
    <div className="schedule-page">
      {/* HEADER */}
      <div className="schedule-header">
        <div>
          <span className="page-label">
            INSTITUTE OF PHYSICAL MEDICINE AND REHABILITATION
          </span>
          <h1>Therapy Schedule & Clinician Allocation</h1>
          <p>
            Real-time patient-to-machine and assigned therapist tracking for all rehabilitation sessions.
          </p>
        </div>

        <div className="schedule-date">
          <CalendarDays size={17} />
          <div>
            <strong>Today's Clinical Schedule</strong>
            <span>PMR Department • Shift Active</span>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="schedule-summary">
        <Summary
          icon={<Users size={17} />}
          label="Total Scheduled"
          value={scheduledPatients.length}
        />
        <Summary
          icon={<Building2 size={17} />}
          label="🏢 In-Department"
          value={`${deptScheduledCount} Patients`}
        />
        <Summary
          icon={<BedDouble size={17} />}
          label="🛏️ In-Ward"
          value={`${wardScheduledCount} Patients`}
        />
        <Summary
          icon={<Activity size={17} />}
          label="Active Sessions"
          value={activeSessions.length}
        />
      </div>

      {/* TIMELINE */}
      <div className="schedule-card">
        <div className="schedule-card-header" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2>Therapy Allocation Timeline</h2>
            <span>Synchronized assignments between patients, machines, and clinical therapists</span>
          </div>

          <div className="schedule-table-filters" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`patient-filter-btn ${careSettingFilter === "ALL" ? "active" : ""}`}
                onClick={() => setCareSettingFilter("ALL")}
                style={{
                  padding: "5px 12px",
                  fontSize: "0.78rem",
                  borderRadius: "20px",
                  cursor: "pointer",
                  border: "1px solid var(--border-color)",
                  background: careSettingFilter === "ALL" ? "var(--primary-color, #0284c7)" : "transparent",
                  color: careSettingFilter === "ALL" ? "#ffffff" : "var(--text-secondary)"
                }}
              >
                All Settings ({scheduledPatients.length})
              </button>
              <button
                type="button"
                className={`patient-filter-btn ${careSettingFilter === "DEPARTMENT" ? "active" : ""}`}
                onClick={() => setCareSettingFilter("DEPARTMENT")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 12px",
                  fontSize: "0.78rem",
                  borderRadius: "20px",
                  cursor: "pointer",
                  border: "1px solid var(--border-color)",
                  background: careSettingFilter === "DEPARTMENT" ? "#0284c7" : "transparent",
                  color: careSettingFilter === "DEPARTMENT" ? "#ffffff" : "var(--text-secondary)"
                }}
              >
                <Building2 size={13} />
                🏢 In-Dept ({deptScheduledCount})
              </button>
              <button
                type="button"
                className={`patient-filter-btn ${careSettingFilter === "WARD" ? "active" : ""}`}
                onClick={() => setCareSettingFilter("WARD")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 12px",
                  fontSize: "0.78rem",
                  borderRadius: "20px",
                  cursor: "pointer",
                  border: "1px solid var(--border-color)",
                  background: careSettingFilter === "WARD" ? "#059669" : "transparent",
                  color: careSettingFilter === "WARD" ? "#ffffff" : "var(--text-secondary)"
                }}
              >
                <BedDouble size={13} />
                🛏️ In-Ward ({wardScheduledCount})
              </button>
            </div>

            <div className="table-search-input">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search patient, therapist, ward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="table-status-select">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="IN_THERAPY">In Therapy</option>
                <option value="WAITING">Waiting</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="schedule-table-wrapper">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>PATIENT</th>
                <th>CARE SETTING</th>
                <th>ROUTING</th>
                <th>ASSIGNED MACHINE</th>
                <th>CLINICAL THERAPIST</th>
                <th>DURATION</th>
                <th>REMAINING</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {filteredPatients.slice(0, 35).map((patient) => {
                const session = getPatientSession(patient.patientCode);
                const assignedTherapist = session
                  ? getTherapist(session.therapistId, session.therapistName)
                  : patient.assignedTherapistId
                  ? getTherapist(patient.assignedTherapistId)
                  : null;

                const isWardPatient = patient.careSetting === "WARD" || Boolean(patient.wardInfo);

                return (
                  <tr key={patient.patientCode}>
                    <td>
                      <div className="schedule-patient">
                        <strong>{patient.name}</strong>
                        <small>{patient.patientCode} • {patient.condition}</small>
                      </div>
                    </td>

                    <td>
                      {isWardPatient ? (
                        <div style={{ display: "inline-flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            background: "rgba(5, 150, 105, 0.1)",
                            color: "#059669",
                            fontSize: "0.72rem",
                            fontWeight: "700"
                          }}>
                            <BedDouble size={12} />
                            In-Ward
                          </span>
                          <small style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                            {patient.wardInfo || "Bedside Visit (35m)"}
                          </small>
                        </div>
                      ) : (
                        <div style={{ display: "inline-flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            background: "rgba(2, 132, 199, 0.1)",
                            color: "#0284c7",
                            fontSize: "0.72rem",
                            fontWeight: "700"
                          }}>
                            <Building2 size={12} />
                            In-Department
                          </span>
                          <small style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                            Therapy Suite (60m)
                          </small>
                        </div>
                      )}
                    </td>

                    <td>
                      <span className={`routing-badge ${patient.routingMode.toLowerCase()}`}>
                        {patient.routingMode}
                      </span>
                    </td>

                    <td>
                      {session ? (
                        <div className="schedule-machine">
                          <strong>{session.machineId}</strong>
                          <span>{session.machineName}</span>
                        </div>
                      ) : (
                        <span className="not-assigned">Awaiting machine</span>
                      )}
                    </td>

                    <td>
                      {assignedTherapist ? (
                        <div className="schedule-therapist-cell">
                          <UserCheck size={14} className="therapist-icon" />
                          <div>
                            <strong>{assignedTherapist.name}</strong>
                            <small>{assignedTherapist.designation}</small>
                          </div>
                        </div>
                      ) : session?.therapistName ? (
                        <div className="schedule-therapist-cell">
                          <UserCheck size={14} className="therapist-icon" />
                          <div>
                            <strong>{session.therapistName}</strong>
                            <small>Assigned Clinician</small>
                          </div>
                        </div>
                      ) : (
                        <span className="therapist-auto">Auto-assign on start</span>
                      )}
                    </td>

                    <td>
                      {session ? `${session.duration} min` : `${patient.trainingDuration} min`}
                    </td>

                    <td>
                      {session ? (
                        <strong className="schedule-timer">
                          {formatTime(session.remainingSeconds)}
                        </strong>
                      ) : (
                        "--"
                      )}
                    </td>

                    <td>
                      <span
                        className={`schedule-status ${patient.status
                          .toLowerCase()
                          .replace("_", "-")}`}
                      >
                        <span></span>
                        {patient.status === "IN_THERAPY"
                          ? "IN THERAPY"
                          : patient.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Summary({ icon, label, value }) {
  return (
    <div className="schedule-summary-card">
      <div className="schedule-summary-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default Schedule;