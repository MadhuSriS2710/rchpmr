import { useState, useMemo } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  Activity,
  MapPin,
  Award,
  UserCheck,
  Stethoscope,
  Brain,
  Mic,
  HandMetal,
  X,
  Briefcase,
  UserPlus,
  Building2,
  BedDouble
} from "lucide-react";
import { apiService } from "../api/apiService";

function Therapists({
  therapists = [],
  setTherapists,
  patients = [],
  _machines = [],
  activeSessions = []
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedSetting, setSelectedSetting] = useState("ALL"); // "ALL" | "DEPARTMENT" | "WARD"
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignPatientCode, setAssignPatientCode] = useState("");

  // Create Staff Modal State
  const [createStaffModalOpen, setCreateStaffModalOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    staffId: "",
    name: "",
    password: "",
    role: "Physiotherapist",
    department: "Physiotherapy",
    room: "",
    phone: "",
    experience: "3+ Years",
    specialty: ""
  });
  const [staffCreateError, setStaffCreateError] = useState("");
  const [staffCreateSuccess, setStaffCreateSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateStaffSubmit = async (e) => {
    e.preventDefault();
    setStaffCreateError("");
    setStaffCreateSuccess("");

    if (!newStaffForm.staffId.trim() || !newStaffForm.name.trim() || !newStaffForm.password.trim()) {
      setStaffCreateError("Staff ID, Full Name, and Password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.createStaff(newStaffForm);
      if (res.success) {
        setStaffCreateSuccess(res.message || "Staff ID created successfully!");
        const therapyDepts = ["Physiotherapy", "Occupational Therapy", "Psychology", "Speech & Audiology"];
        const isTherapyStaff = therapyDepts.includes(newStaffForm.department) || /therapist|physiotherapist|psychologist|audiologist/i.test(newStaffForm.role || "");

        if (isTherapyStaff) {
          const newClinician = {
            id: newStaffForm.staffId.toUpperCase(),
            name: newStaffForm.name.trim(),
            designation: newStaffForm.role,
            department: newStaffForm.department,
            category: newStaffForm.role.includes("Senior") ? "Senior" : "Staff",
            phone: newStaffForm.phone || "+91 98401 00000",
            experience: newStaffForm.experience || "3+ Years",
            room: newStaffForm.room || "General PMR Ward",
            specialty: newStaffForm.specialty || "Physical Medicine & Rehabilitation",
            status: "AVAILABLE",
            currentPatient: null,
            currentMachine: null,
            completedSessionsToday: 0,
            avatarColor: "#059669"
          };
          if (setTherapists) {
            setTherapists((prev) => [newClinician, ...prev]);
          }
        }
        setTimeout(() => {
          setCreateStaffModalOpen(false);
          setStaffCreateSuccess("");
          setNewStaffForm({
            staffId: "",
            name: "",
            password: "",
            role: "Physiotherapist",
            department: "Physiotherapy",
            room: "",
            phone: "",
            experience: "3+ Years",
            specialty: ""
          });
        }, 1500);
      }
    } catch (err) {
      setStaffCreateError(err.message || "Failed to create Staff ID.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // METRICS
  // =========================================================
  const totalCount = therapists.length;
  const seniorCount = therapists.filter(
    (t) => t.category === "Senior" || t.designation.includes("Senior")
  ).length;
  const ptCount = therapists.filter((t) => t.department === "Physiotherapy").length;
  const otCount = therapists.filter((t) => t.department === "Occupational Therapy").length;
  const speechCount = therapists.filter((t) => t.department === "Speech & Audiology").length;
  const psychCount = therapists.filter((t) => t.department === "Psychology").length;

  const inSessionCount = therapists.filter(
    (t) =>
      t.status === "IN_SESSION" ||
      activeSessions.some((s) => s.therapistId === t.id)
  ).length;

  const availableCount = totalCount - inSessionCount;

  // Department (1:6) vs Ward (1:9) staffing counts
  const deptStaffCount = therapists.filter(
    (t) =>
      !(t.room || "").toLowerCase().includes("ward") &&
      !(t.room || "").toLowerCase().includes("icu")
  ).length;

  const wardStaffCount = therapists.filter(
    (t) =>
      (t.room || "").toLowerCase().includes("ward") ||
      (t.room || "").toLowerCase().includes("icu")
  ).length;

  // =========================================================
  // FILTERING
  // =========================================================
  const filteredTherapists = useMemo(() => {
    return therapists.filter((therapist) => {
      // Setting filter (1:6 Dept vs 1:9 Ward)
      const isWardClinician =
        (therapist.room || "").toLowerCase().includes("ward") ||
        (therapist.room || "").toLowerCase().includes("icu");

      if (selectedSetting === "DEPARTMENT" && isWardClinician) return false;
      if (selectedSetting === "WARD" && !isWardClinician) return false;

      // Dept filter
      if (selectedDept === "SENIOR") {
        if (therapist.category !== "Senior" && !therapist.designation.includes("Senior")) {
          return false;
        }
      } else if (selectedDept !== "ALL" && therapist.department !== selectedDept) {
        return false;
      }

      // Status filter
      const isCurrentlyInSession =
        therapist.status === "IN_SESSION" ||
        activeSessions.some((s) => s.therapistId === therapist.id);

      if (selectedStatus === "AVAILABLE" && isCurrentlyInSession) return false;
      if (selectedStatus === "IN_SESSION" && !isCurrentlyInSession) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = therapist.name.toLowerCase().includes(query);
        const matchesId = therapist.id.toLowerCase().includes(query);
        const matchesRole = therapist.designation.toLowerCase().includes(query);
        const matchesDept = therapist.department.toLowerCase().includes(query);
        const matchesSpec = therapist.specialty.toLowerCase().includes(query);
        const matchesRoom = therapist.room?.toLowerCase().includes(query);
        return matchesName || matchesId || matchesRole || matchesDept || matchesSpec || matchesRoom;
      }

      return true;
    });
  }, [therapists, selectedDept, selectedStatus, selectedSetting, searchTerm, activeSessions]);

  // Helper for department icon
  const getDeptIcon = (dept) => {
    switch (dept) {
      case "Physiotherapy":
        return <Activity size={16} />;
      case "Occupational Therapy":
        return <HandMetal size={16} />;
      case "Speech & Audiology":
        return <Mic size={16} />;
      case "Psychology":
        return <Brain size={16} />;
      default:
        return <Stethoscope size={16} />;
    }
  };

  // Helper for badge color class
  const getBadgeClass = (designation) => {
    if (designation.includes("Senior")) return "badge-senior";
    if (designation.includes("Physiotherapist")) return "badge-pt";
    if (designation.includes("Occupational")) return "badge-ot";
    if (designation.includes("Psychologist")) return "badge-psych";
    if (designation.includes("Audiologist") || designation.includes("Speech")) return "badge-speech";
    return "badge-default";
  };

  // Toggle therapist status manually
  const toggleTherapistStatus = (id) => {
    if (!setTherapists) return;
    setTherapists((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const newStatus = t.status === "AVAILABLE" ? "ON_BREAK" : "AVAILABLE";
        return { ...t, status: newStatus };
      })
    );
  };

  // Handle direct assignment
  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!assignPatientCode || !selectedTherapist || !setTherapists) return;

    setTherapists((prev) =>
      prev.map((t) => {
        if (t.id === selectedTherapist.id) {
          return {
            ...t,
            status: "IN_SESSION",
            currentPatient: assignPatientCode
          };
        }
        return t;
      })
    );
    setAssignModalOpen(false);
    setAssignPatientCode("");
  };

  return (
    <div className="therapists-page">
      {/* =================================================
          PAGE HEADER
      ================================================= */}
      <div className="therapists-header">
        <div>
          <span className="page-label">INSTITUTE OF PHYSICAL MEDICINE AND REHABILITATION</span>
          <h1>Clinical Staff & Therapists Directory</h1>
          <p>
            Certified clinical team across Physiotherapy, Occupational Therapy, Speech & Audiology, and Psychology.
          </p>
        </div>

        <div className="therapist-header-actions">
          <button
            type="button"
            className="create-staff-btn"
            onClick={() => setCreateStaffModalOpen(true)}
          >
            <UserPlus size={16} />
            <span>+ Create Staff ID</span>
          </button>

          <div className="staff-roster-pill">
            <UserCheck size={16} />
            <strong>{totalCount} CERTIFIED CLINICIANS</strong>
          </div>
        </div>
      </div>

      {/* =================================================
          METRIC SUMMARY CARDS
      ================================================= */}
      <div className="therapist-summary-grid">
        <div className="therapist-summary-card">
          <div className="summary-icon icon-all">
            <Users size={20} />
          </div>
          <div>
            <span>Total Clinicians</span>
            <strong>{totalCount}</strong>
            <small>Active in Roster</small>
          </div>
        </div>

        <div className="therapist-summary-card">
          <div className="summary-icon icon-senior">
            <Award size={20} />
          </div>
          <div>
            <span>Senior Specialists</span>
            <strong>{seniorCount}</strong>
            <small>Dept Leadership</small>
          </div>
        </div>

        <div className="therapist-summary-card">
          <div className="summary-icon icon-pt">
            <Activity size={20} />
          </div>
          <div>
            <span>Physiotherapists</span>
            <strong>{ptCount}</strong>
            <small>Robotics & MAT</small>
          </div>
        </div>

        <div className="therapist-summary-card">
          <div className="summary-icon icon-ot">
            <HandMetal size={20} />
          </div>
          <div>
            <span>Occupational Therapists</span>
            <strong>{otCount}</strong>
            <small>Hand & Coma Rehab</small>
          </div>
        </div>

        <div className="therapist-summary-card">
          <div className="summary-icon icon-speech">
            <Mic size={20} />
          </div>
          <div>
            <span>Speech & Audiology</span>
            <strong>{speechCount}</strong>
            <small>Language & Swallow</small>
          </div>
        </div>

        <div className="therapist-summary-card">
          <div className="summary-icon icon-psych">
            <Brain size={20} />
          </div>
          <div>
            <span>Psychology</span>
            <strong>{psychCount}</strong>
            <small>Cognitive & Counselling</small>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTER BAR & CONTROLS
      ================================================= */}
      <div className="therapist-controls-card">
        {/* Department Tabs */}
        <div className="department-tabs">
          <button
            className={selectedDept === "ALL" ? "dept-tab active" : "dept-tab"}
            onClick={() => setSelectedDept("ALL")}
          >
            All Staff ({totalCount})
          </button>
          <button
            className={selectedDept === "SENIOR" ? "dept-tab active" : "dept-tab"}
            onClick={() => setSelectedDept("SENIOR")}
          >
            Senior PT ({seniorCount})
          </button>
          <button
            className={selectedDept === "Physiotherapy" ? "dept-tab active" : "dept-tab"}
            onClick={() => setSelectedDept("Physiotherapy")}
          >
            Physiotherapy ({ptCount})
          </button>
          <button
            className={selectedDept === "Occupational Therapy" ? "dept-tab active" : "dept-tab"}
            onClick={() => setSelectedDept("Occupational Therapy")}
          >
            Occupational Therapy ({otCount})
          </button>
          <button
            className={selectedDept === "Speech & Audiology" ? "dept-tab active" : "dept-tab"}
            onClick={() => setSelectedDept("Speech & Audiology")}
          >
            Speech & Audiology ({speechCount})
          </button>
          <button
            className={selectedDept === "Psychology" ? "dept-tab active" : "dept-tab"}
            onClick={() => setSelectedDept("Psychology")}
          >
            Psychology ({psychCount})
          </button>
        </div>

        {/* Search & Secondary Filter */}
        <div className="search-and-actions">
          <div className="therapist-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search therapist by name, ID (e.g. TH-001), specialty, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm("")}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="status-filter-pills">
            <button
              className={selectedStatus === "ALL" ? "status-pill active" : "status-pill"}
              onClick={() => setSelectedStatus("ALL")}
            >
              All Status
            </button>
            <button
              className={selectedStatus === "AVAILABLE" ? "status-pill active" : "status-pill"}
              onClick={() => setSelectedStatus("AVAILABLE")}
            >
              <span className="dot-indicator green"></span>
              Available ({availableCount})
            </button>
            <button
              className={selectedStatus === "IN_SESSION" ? "status-pill active" : "status-pill"}
              onClick={() => setSelectedStatus("IN_SESSION")}
            >
              <span className="dot-indicator amber"></span>
              In Session ({inSessionCount})
            </button>
          </div>

          {/* CARE SETTING RATIO FILTER PILLS */}
          <div className="status-filter-pills" style={{ marginTop: "4px" }}>
            <button
              className={selectedSetting === "ALL" ? "status-pill active" : "status-pill"}
              onClick={() => setSelectedSetting("ALL")}
            >
              All Settings
            </button>
            <button
              className={selectedSetting === "DEPARTMENT" ? "status-pill active" : "status-pill"}
              onClick={() => setSelectedSetting("DEPARTMENT")}
              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <Building2 size={12} />
              🏢 In-Dept · 1:6 Ratio ({deptStaffCount})
            </button>
            <button
              className={selectedSetting === "WARD" ? "status-pill active" : "status-pill"}
              onClick={() => setSelectedSetting("WARD")}
              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <BedDouble size={12} />
              🛏️ In-Ward · 1:9 Ratio ({wardStaffCount})
            </button>
          </div>

          <div className="view-mode-toggle">
            <button
              className={viewMode === "grid" ? "mode-btn active" : "mode-btn"}
              onClick={() => setViewMode("grid")}
              title="Grid Card View"
            >
              Grid
            </button>
            <button
              className={viewMode === "table" ? "mode-btn active" : "mode-btn"}
              onClick={() => setViewMode("table")}
              title="Table Roster View"
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          THERAPISTS DISPLAY (GRID OR TABLE)
      ================================================= */}
      {viewMode === "grid" ? (
        <div className="therapist-card-grid">
          {filteredTherapists.map((therapist) => {
            const activeSession = activeSessions.find(
              (s) => s.therapistId === therapist.id || s.therapistName === therapist.name
            );
            const isInSession =
              therapist.status === "IN_SESSION" || Boolean(activeSession);
            const initials = therapist.name
              .replace(/^(Mr\.|Mrs\.|Ms\.)\s*/i, "")
              .substring(0, 2)
              .toUpperCase();

            return (
              <div
                className={`therapist-card ${isInSession ? "in-session" : "available"}`}
                key={therapist.id}
              >
                {/* CARD TOP */}
                <div className="therapist-card-top">
                  <div
                    className="therapist-avatar"
                    style={{ backgroundColor: therapist.avatarColor || "#0284c7" }}
                  >
                    {initials}
                  </div>

                  <div className="therapist-top-info">
                    <div className="therapist-id-row">
                      <span className="therapist-id-tag">{therapist.id}</span>
                      <span
                        className={`status-chip ${
                          isInSession ? "in-therapy" : "available"
                        }`}
                      >
                        <span className="pulse-dot"></span>
                        {isInSession ? "IN SESSION" : "AVAILABLE"}
                      </span>
                    </div>

                    <h3 className="therapist-name">{therapist.name}</h3>
                    <span className={`designation-badge ${getBadgeClass(therapist.designation)}`}>
                      {therapist.designation}
                    </span>
                  </div>
                </div>

                {/* SPECIALTY & DEPARTMENT */}
                <div className="therapist-details">
                  <div className="detail-item">
                    <span className="detail-label">DEPARTMENT</span>
                    <span className="dept-tag">
                      {getDeptIcon(therapist.department)}
                      {therapist.department}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">CLINICAL FOCUS</span>
                    <p className="specialty-text">{therapist.specialty}</p>
                  </div>

                  <div className="detail-row-flex">
                    <div>
                      <span className="detail-label">LOCATION</span>
                      <span className="meta-text">
                        <MapPin size={12} /> {therapist.room || "Rehab Dept"}
                      </span>
                    </div>
                    <div>
                      <span className="detail-label">EXPERIENCE</span>
                      <span className="meta-text">
                        <Award size={12} /> {therapist.experience}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACTIVE SESSION OR AVAILABILITY */}
                {isInSession ? (
                  <div className="active-session-banner">
                    <div className="session-pulse-icon">
                      <Activity size={14} />
                    </div>
                    <div>
                      <strong>Active Clinical Session</strong>
                      <small>
                        {activeSession
                          ? `${activeSession.patientCode} • ${activeSession.machineName}`
                          : therapist.currentPatient
                          ? `Assigned to ${therapist.currentPatient}`
                          : "Treating Patient"}
                      </small>
                    </div>
                  </div>
                ) : (
                  <div className="ready-session-banner">
                    <CheckCircle2 size={14} />
                    <span>Ready for patient assignment</span>
                  </div>
                )}

                {/* CLINICAL RATIO & CAPACITY METER */}
                {(() => {
                  const isWardClinician =
                    (therapist.room || "").toLowerCase().includes("ward") ||
                    (therapist.room || "").toLowerCase().includes("icu");
                  const quota = isWardClinician ? 9 : 6;
                  const currentSessions = (therapist.completedSessionsToday || 0) + (isInSession ? 1 : 0);
                  const slotsRemaining = Math.max(0, quota - currentSessions);
                  const pct = Math.min(100, Math.round((currentSessions / quota) * 100));
                  const isFull = currentSessions >= quota;

                  return (
                    <div style={{
                      marginTop: "10px",
                      padding: "8px 10px",
                      background: "rgba(0,0,0,0.02)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          color: isWardClinician ? "#059669" : "#0284c7"
                        }}>
                          {isWardClinician ? <BedDouble size={12} /> : <Building2 size={12} />}
                          {isWardClinician ? "In-Ward (1:9 Ratio)" : "In-Department (1:6 Ratio)"}
                        </span>
                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: "700",
                          color: isFull ? "#d97706" : "var(--text-secondary)"
                        }}>
                          {isFull ? "QUOTA FULL" : `${slotsRemaining} slots left`}
                        </span>
                      </div>
                      <div style={{ height: "6px", width: "100%", background: "rgba(0,0,0,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: isFull ? "#f59e0b" : isWardClinician ? "#059669" : "#0284c7",
                          borderRadius: "3px",
                          transition: "width 0.3s ease"
                        }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                        <span>Today's Load: {currentSessions}/{quota} Patients</span>
                        <span>{pct}% Cap</span>
                      </div>
                    </div>
                  );
                })()}

                {/* CARD FOOTER */}
                <div className="therapist-card-footer">
                  <button
                    className="view-profile-btn"
                    onClick={() => setSelectedTherapist(therapist)}
                  >
                    View Details
                  </button>
                  <button
                    className={
                      isInSession ? "action-btn release-btn" : "action-btn assign-btn"
                    }
                    onClick={() => {
                      setSelectedTherapist(therapist);
                      setAssignModalOpen(true);
                    }}
                  >
                    {isInSession ? "View Session" : "Assign Patient"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="therapist-table-wrapper">
          <table className="therapist-table">
            <thead>
              <tr>
                <th>STAFF ID</th>
                <th>THERAPIST NAME</th>
                <th>DESIGNATION</th>
                <th>DEPARTMENT</th>
                <th>LOCATION</th>
                <th>SPECIALTY / PROTOCOL</th>
                <th>EXPERIENCE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredTherapists.map((therapist) => {
                const activeSession = activeSessions.find(
                  (s) => s.therapistId === therapist.id || s.therapistName === therapist.name
                );
                const isInSession =
                  therapist.status === "IN_SESSION" || Boolean(activeSession);

                return (
                  <tr key={therapist.id}>
                    <td>
                      <span className="therapist-id-tag">{therapist.id}</span>
                    </td>
                    <td>
                      <div className="table-therapist-cell">
                        <div
                          className="table-avatar"
                          style={{ backgroundColor: therapist.avatarColor || "#0284c7" }}
                        >
                          {therapist.name
                            .replace(/^(Mr\.|Mrs\.|Ms\.)\s*/i, "")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <strong>{therapist.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className={`designation-badge ${getBadgeClass(therapist.designation)}`}>
                        {therapist.designation}
                      </span>
                    </td>
                    <td>
                      <span className="dept-tag">
                        {getDeptIcon(therapist.department)}
                        {therapist.department}
                      </span>
                    </td>
                    <td>
                      <span className="meta-text">{therapist.room || "PMR Hall"}</span>
                    </td>
                    <td className="specialty-cell">
                      <span>{therapist.specialty}</span>
                    </td>
                    <td>
                      <span className="meta-text">{therapist.experience}</span>
                    </td>
                    <td>
                      <span
                        className={`status-chip ${
                          isInSession ? "in-therapy" : "available"
                        }`}
                      >
                        <span className="pulse-dot"></span>
                        {isInSession ? "IN SESSION" : "AVAILABLE"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="table-action-btn"
                        onClick={() => setSelectedTherapist(therapist)}
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* EMPTY SEARCH STATE */}
      {filteredTherapists.length === 0 && (
        <div className="therapists-empty-state">
          <Search size={32} />
          <h3>No clinicians found</h3>
          <p>Try adjusting your search criteria or clear the department filters.</p>
          <button
            className="clear-filter-btn"
            onClick={() => {
              setSearchTerm("");
              setSelectedDept("ALL");
              setSelectedStatus("ALL");
            }}
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* =================================================
          THERAPIST PROFILE & ASSIGNMENT MODAL
      ================================================= */}
      {selectedTherapist && !assignModalOpen && (
        <div className="modal-backdrop" onClick={() => setSelectedTherapist(null)}>
          <div className="therapist-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title">
                <span className="modal-id">{selectedTherapist.id}</span>
                <h2>{selectedTherapist.name}</h2>
                <span
                  className={`designation-badge ${getBadgeClass(
                    selectedTherapist.designation
                  )}`}
                >
                  {selectedTherapist.designation}
                </span>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setSelectedTherapist(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-info-grid">
                <div className="modal-info-box">
                  <span className="info-title">DEPARTMENT</span>
                  <strong>{selectedTherapist.department}</strong>
                </div>
                <div className="modal-info-box">
                  <span className="info-title">CLINICAL EXPERIENCE</span>
                  <strong>{selectedTherapist.experience}</strong>
                </div>
                <div className="modal-info-box">
                  <span className="info-title">STATION / ROOM</span>
                  <strong>{selectedTherapist.room || "Institute PMR"}</strong>
                </div>
                <div className="modal-info-box">
                  <span className="info-title">DUTY CONTACT</span>
                  <strong>{selectedTherapist.phone || "+91 98401 23400"}</strong>
                </div>
              </div>

              <div className="modal-section">
                <h3>Clinical Expertise & Protocols</h3>
                <p>{selectedTherapist.specialty}</p>
              </div>

              <div className="modal-section">
                <h3>Today's Activity</h3>
                <div className="activity-stats-row">
                  <div className="stat-pill">
                    <span>Completed Sessions Today:</span>
                    <strong>{selectedTherapist.completedSessionsToday || 3}</strong>
                  </div>
                  <div className="stat-pill">
                    <span>Current Status:</span>
                    <strong
                      style={{
                        color:
                          selectedTherapist.status === "AVAILABLE"
                            ? "#10b981"
                            : "#f59e0b"
                      }}
                    >
                      {selectedTherapist.status}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => toggleTherapistStatus(selectedTherapist.id)}
              >
                {selectedTherapist.status === "AVAILABLE"
                  ? "Mark on Break"
                  : "Mark Available"}
              </button>

              <button
                className="primary-action-btn"
                onClick={() => setAssignModalOpen(true)}
              >
                Assign to Patient Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN MODAL */}
      {assignModalOpen && selectedTherapist && (
        <div className="modal-backdrop" onClick={() => setAssignModalOpen(false)}>
          <div className="therapist-detail-modal assign-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-id">ASSIGNMENT</span>
                <h2>Assign {selectedTherapist.name}</h2>
                <small>{selectedTherapist.designation}</small>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setAssignModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="modal-body">
              <div className="form-group">
                <label>Select Waiting Patient *</label>
                <select
                  value={assignPatientCode}
                  onChange={(e) => setAssignPatientCode(e.target.value)}
                  required
                >
                  <option value="">-- Choose Patient Awaiting Therapy --</option>
                  {patients
                    .filter((p) => p.status === "WAITING")
                    .slice(0, 20)
                    .map((p) => (
                      <option key={p.patientCode} value={p.patientCode}>
                        {p.patientCode} - {p.name} ({p.condition})
                      </option>
                    ))}
                </select>
              </div>

              <div className="modal-alert-box">
                <Briefcase size={18} />
                <div>
                  <strong>Direct Clinical Assignment</strong>
                  <p>
                    Assigning {selectedTherapist.name} will transition their status to IN_SESSION and attach them to this patient.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setAssignModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-action-btn">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CREATE REAL-TIME STAFF ID MODAL */}
      {createStaffModalOpen && (
        <div className="modal-backdrop" onClick={() => setCreateStaffModalOpen(false)}>
          <div className="therapist-detail-modal create-staff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-id">STAFF REGISTRATION & DATABASE ENROLLMENT</span>
                <h2>Create Real-Time Staff ID</h2>
                <small>Registers clinician into SQLite database & sets secure login credentials</small>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setCreateStaffModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStaffSubmit} className="modal-body create-staff-form">
              {staffCreateError && (
                <div className="create-staff-error-banner">
                  <span>{staffCreateError}</span>
                </div>
              )}

              {staffCreateSuccess && (
                <div className="create-staff-success-banner">
                  <CheckCircle2 size={16} />
                  <span>{staffCreateSuccess}</span>
                </div>
              )}

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Staff ID / Username *</label>
                  <input
                    type="text"
                    placeholder="e.g. PT-051 or anand"
                    value={newStaffForm.staffId}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, staffId: e.target.value })}
                    required
                  />
                  <small className="field-hint">Used for system login</small>
                </div>

                <div className="form-group">
                  <label>Initial Login Password *</label>
                  <input
                    type="text"
                    placeholder="e.g. staff@2026"
                    value={newStaffForm.password}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                    required
                  />
                  <small className="field-hint">Hashed with bcrypt in database</small>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Clinician Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Anand Verma"
                    value={newStaffForm.name}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Department *</label>
                  <select
                    value={newStaffForm.department}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, department: e.target.value })}
                  >
                    <option value="Physiotherapy">Physiotherapy</option>
                    <option value="Occupational Therapy">Occupational Therapy</option>
                    <option value="Speech & Audiology">Speech & Audiology</option>
                    <option value="Psychology">Psychology</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Designation / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Physiotherapist / Consultant"
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Room / Cabin</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 105 - Robotics Bay"
                    value={newStaffForm.room}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, room: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98401 99999"
                    value={newStaffForm.phone}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Experience</label>
                  <input
                    type="text"
                    placeholder="e.g. 5+ Years"
                    value={newStaffForm.experience}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, experience: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Clinical Specialty & Focus</label>
                <input
                  type="text"
                  placeholder="e.g. Spinal Cord Rehab, Robotic Gait Systems"
                  value={newStaffForm.specialty}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, specialty: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setCreateStaffModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-action-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating & Enrolling..." : "Create Real-Time Staff ID"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Therapists;
