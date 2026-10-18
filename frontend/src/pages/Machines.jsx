import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Wrench,
  Users,
  Clock3,
  UserCheck,
  Brain,
  HandMetal,
  Mic,
  Info
} from "lucide-react";

import { therapyProtocols } from "../data/therapyProtocols";

function Machines({
  machines = [],
  activeSessions = [],
  patients = [],
  _therapists = []
}) {
  const [activeTab, setActiveTab] = useState("equipment"); // 'equipment' | 'protocols'
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  const available = machines.filter(
    (machine) => machine.status === "AVAILABLE"
  ).length;

  const busy = machines.filter(
    (machine) => machine.status === "BUSY"
  ).length;

  const maintenance = machines.filter(
    (machine) => machine.status === "MAINTENANCE"
  ).length;

  const getSession = (machineId) =>
    activeSessions.find((session) => session.machineId === machineId);

  const getPatient = (patientCode) =>
    patients.find((patient) => patient.patientCode === patientCode);

  const formatTime = (seconds = 0) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  };

  const filteredMachines = machines.filter((machine) => {
    if (departmentFilter === "ALL") return true;
    return machine.department === departmentFilter;
  });

  return (
    <div className="machines-page">
      {/* HEADER */}
      <div className="machines-header">
        <div>
          <span className="page-label">
            INSTITUTE OF PHYSICAL MEDICINE AND REHABILITATION
          </span>
          <h1>Equipments & Therapy Protocols</h1>
          <p>
            Monitor real-time status of 14 specialized rehabilitation systems and clinical therapy department timings.
          </p>
        </div>

        <div className="header-toggle-tabs">
          <button
            className={activeTab === "equipment" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("equipment")}
          >
            <Activity size={16} />
            14 Rehabilitation Equipments
          </button>
          <button
            className={activeTab === "protocols" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("protocols")}
          >
            <Clock3 size={16} />
            Clinical Therapy Timings
          </button>
        </div>
      </div>

      {activeTab === "equipment" ? (
        <>
          {/* SUMMARY */}
          <div className="machines-summary">
            <MachineSummary
              label="Available"
              value={available}
              icon={<CheckCircle2 size={17} />}
              type="available"
            />
            <MachineSummary
              label="In Use"
              value={busy}
              icon={<Activity size={17} />}
              type="busy"
            />
            <MachineSummary
              label="Maintenance"
              value={maintenance}
              icon={<Wrench size={17} />}
              type="maintenance"
            />
            <MachineSummary
              label="Total Systems"
              value={machines.length}
              icon={<Users size={17} />}
              type="total"
            />
          </div>

          {/* DEPARTMENT FILTER */}
          <div className="machine-filter-bar">
            <span>Filter by Department:</span>
            <button
              className={departmentFilter === "ALL" ? "filter-pill active" : "filter-pill"}
              onClick={() => setDepartmentFilter("ALL")}
            >
              All Equipments ({machines.length})
            </button>
            <button
              className={departmentFilter === "Physiotherapy" ? "filter-pill active" : "filter-pill"}
              onClick={() => setDepartmentFilter("Physiotherapy")}
            >
              Physiotherapy ({machines.filter((m) => m.department === "Physiotherapy").length})
            </button>
            <button
              className={departmentFilter === "Occupational Therapy" ? "filter-pill active" : "filter-pill"}
              onClick={() => setDepartmentFilter("Occupational Therapy")}
            >
              Occupational Therapy ({machines.filter((m) => m.department === "Occupational Therapy").length})
            </button>
          </div>

          {/* MACHINE GRID */}
          <div className="machine-management-grid">
            {filteredMachines.map((machine) => {
              const session = getSession(machine.id);
              const patient = session ? getPatient(session.patientCode) : null;
              const assignedTherapist = session?.therapistName
                ? session.therapistName
                : null;

              return (
                <div
                  className={`machine-management-card ${machine.status.toLowerCase()}`}
                  key={machine.id}
                >
                  {/* CARD HEADER */}
                  <div className="management-machine-header">
                    <div>
                      <strong>{machine.id}</strong>
                      <span className="machine-category-pill">{machine.department || machine.type}</span>
                    </div>

                    <span
                      className={`management-machine-status ${machine.status.toLowerCase()}`}
                    >
                      <i></i>
                      {machine.status === "BUSY" ? "IN USE" : machine.status}
                    </span>
                  </div>

                  {/* MACHINE NAME */}
                  <h2>{machine.name}</h2>
                  <p className="machine-type-label">{machine.type}</p>

                  {/* TIMING SPECIFICATION FROM DOCUMENT */}
                  <div className="machine-timing-badge">
                    <Clock3 size={14} />
                    <span>TIMING SPECIFICATION:</span>
                    <strong>{machine.timing || "20 - 40 Mints"}</strong>
                  </div>

                  {/* ACTIVE PATIENT & THERAPIST */}
                  {session ? (
                    <div className="machine-current-details">
                      <div className="machine-current">
                        <div className="machine-current-icon">
                          <Users size={15} />
                        </div>
                        <div>
                          <span>CURRENT PATIENT</span>
                          <strong>{session.patientCode}</strong>
                          <small>{patient?.name || session.patientName}</small>
                        </div>
                      </div>

                      {assignedTherapist && (
                        <div className="machine-therapist-box">
                          <UserCheck size={14} />
                          <div>
                            <span>ASSIGNED CLINICIAN</span>
                            <strong>{assignedTherapist}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : machine.status === "MAINTENANCE" ? (
                    <div className="machine-empty maintenance-box">
                      <Wrench size={19} />
                      <span>Under scheduled calibration</span>
                    </div>
                  ) : (
                    <div className="machine-empty">
                      <CheckCircle2 size={19} />
                      <span>Ready for next patient allocation</span>
                    </div>
                  )}

                  {/* SESSION TIMER */}
                  {session && (
                    <div className="machine-session-info">
                      <div>
                        <span>REMAINING</span>
                        <strong>{formatTime(session.remainingSeconds)}</strong>
                      </div>
                      <div>
                        <span>SESSION</span>
                        <strong>{session.duration} min</strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* PROTOCOLS & TIMINGS VIEW (FROM IMAGE 2) */
        <div className="protocols-view">
          <div className="protocols-banner">
            <Info size={20} />
            <div>
              <h3>Institute Clinical Therapy Protocols & Prescribed Timings</h3>
              <p>Official treatment service durations and guidelines established by the PMR Directorate.</p>
            </div>
          </div>

          <div className="protocol-sections-grid">
            {therapyProtocols.map((protocol) => {
              const getIcon = () => {
                switch (protocol.department) {
                  case "Physiotherapy":
                    return <Activity size={20} />;
                  case "Occupational Therapy":
                    return <HandMetal size={20} />;
                  case "Speech & Audiology":
                    return <Mic size={20} />;
                  case "Psychology":
                    return <Brain size={20} />;
                  default:
                    return <Activity size={20} />;
                }
              };

              return (
                <div className="protocol-category-card" key={protocol.id}>
                  <div className="protocol-category-header">
                    <div className="protocol-icon-wrap" style={{ color: protocol.color }}>
                      {getIcon()}
                    </div>
                    <div>
                      <h2>{protocol.title}</h2>
                      <small>Clinical Lead: {protocol.lead}</small>
                    </div>
                  </div>

                  <div className="services-list">
                    {protocol.services.map((service, idx) => (
                      <div className="service-item" key={service.id}>
                        <div className="service-number">{idx + 1}</div>
                        <div className="service-content">
                          <div className="service-title-row">
                            <strong>{service.name}</strong>
                            <span className="timing-chip">
                              <Clock3 size={13} />
                              {service.timing}
                            </span>
                          </div>
                          <p>{service.description}</p>
                          <div className="conditions-tags">
                            {service.typicalConditions.map((cond) => (
                              <span key={cond} className="cond-tag">{cond}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MachineSummary({ label, value, icon, type }) {
  return (
    <div className="machine-summary-card">
      <div className={`machine-summary-icon ${type}`}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default Machines;