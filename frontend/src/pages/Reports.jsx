import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Activity,
  Download,
  Database,
  Search,
  RotateCcw,
  Sparkles,
  BedDouble,
  Building2,
  UserCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { apiService } from "../api/apiService";

function Reports({ onStartNewDayShift }) {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("ALL"); // "ALL" | "TODAY" | "YESTERDAY"
  const [activeTab, setActiveTab] = useState("PATIENTS"); // "PATIENTS" | "SESSIONS" | "DAILY_STATS"
  const [actionNotice, setActionNotice] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await apiService.getReportsHistory();
      if (res) {
        setHistoryData(res);
      }
    } catch (err) {
      console.warn("Failed to fetch reports history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // Live polling every 12 seconds for real-time history updates
    const interval = setInterval(loadHistory, 12000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  // Handle End Day Shift & Archive
  const handleArchiveShift = async () => {
    if (
      window.confirm(
        "Are you sure you want to archive today's completed patients and start a fresh queue for the next day shift?\n\n• Today's patients will move safely into the Historical Archive.\n• A fresh clean queue will be ready for new morning registrations.\n• Clinicians & Machines will reset to AVAILABLE."
      )
    ) {
      const res = await apiService.startNewDayShift();
      if (res?.success) {
        setActionNotice("🌅 Shift archived successfully! New morning queue ready.");
        await loadHistory();
        if (onStartNewDayShift) {
          onStartNewDayShift();
        }
        setTimeout(() => setActionNotice(""), 6000);
      }
    }
  };

  // Filtered Patients
  const filteredPatients = useMemo(() => {
    if (!historyData?.patients) return [];
    return historyData.patients.filter((p) => {
      const pDate = (p.createdAt || "").slice(0, 10);
      if (selectedDateFilter === "TODAY" && pDate !== todayStr) return false;
      if (selectedDateFilter === "YESTERDAY" && pDate !== yesterdayStr) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.patientCode?.toLowerCase().includes(q) ||
        p.condition?.toLowerCase().includes(q) ||
        p.wardInfo?.toLowerCase().includes(q) ||
        p.careSetting?.toLowerCase().includes(q)
      );
    });
  }, [historyData, selectedDateFilter, searchTerm, todayStr, yesterdayStr]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    if (!historyData?.sessions) return [];
    return historyData.sessions.filter((s) => {
      const sDate = s.started_at ? new Date(s.started_at).toISOString().slice(0, 10) : "";
      if (selectedDateFilter === "TODAY" && sDate !== todayStr) return false;
      if (selectedDateFilter === "YESTERDAY" && sDate !== yesterdayStr) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        s.patient_name?.toLowerCase().includes(q) ||
        s.patient_code?.toLowerCase().includes(q) ||
        s.machine_name?.toLowerCase().includes(q) ||
        s.therapist_name?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q)
      );
    });
  }, [historyData, selectedDateFilter, searchTerm, todayStr, yesterdayStr]);

  const summary = historyData?.summary || {
    totalPatients: 0,
    archivedPatients: 0,
    activePatients: 0,
    totalSessions: 0,
    completedSessions: 0,
    totalReclaimedMinutes: 0
  };

  return (
    <div className="reports-page" style={{ padding: "24px 32px", maxWidth: "1500px", margin: "0 auto" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1px", color: "#059669", textTransform: "uppercase" }}>
            INSTITUTE OF PHYSICAL MEDICINE AND REHABILITATION (IPMR)
          </span>
          <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a", margin: "6px 0" }}>
            Clinical Reports & Daily History Archive
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0 }}>
            Permanent SQLite archive: Review past patient throughput, treatment protocols, and daily shift records.
          </p>
        </div>

        {/* TOP ACTIONS */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleArchiveShift}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "0.9rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
            }}
            title="Archives today's patients into history and clears queue for next morning shift"
          >
            <Sparkles size={16} />
            Start New Day Shift (Archive Queue)
          </button>

          <a
            href={apiService.getPatientsExportUrl()}
            download
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 15px",
              background: "#ffffff",
              color: "#2563eb",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "0.85rem",
              textDecoration: "none",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
            }}
          >
            <Download size={15} />
            Export Patients (CSV)
          </a>

          <a
            href={apiService.getSessionsExportUrl()}
            download
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 15px",
              background: "#ffffff",
              color: "#7c3aed",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "0.85rem",
              textDecoration: "none",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
            }}
          >
            <FileText size={15} />
            Export Sessions (CSV)
          </a>

          <a
            href={apiService.getDatabaseBackupUrl()}
            download
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 15px",
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "0.85rem",
              textDecoration: "none",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
            }}
          >
            <Database size={15} />
            Download Database (.db)
          </a>
        </div>
      </div>

      {/* NOTICE BANNER */}
      {actionNotice && (
        <div style={{ padding: "12px 18px", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", borderRadius: "10px", marginBottom: "20px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={18} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* SUMMARY METRIC CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "0.85rem", fontWeight: "600" }}>
            <span>TOTAL ALL-TIME PATIENTS</span>
            <UserCheck size={18} color="#059669" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
            {summary.totalPatients}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
            {summary.activePatients} Today's Active · {summary.archivedPatients} In Historical Archive
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "0.85rem", fontWeight: "600" }}>
            <span>SESSIONS DELIVERED</span>
            <Activity size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
            {summary.completedSessions}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
            Across 14 Robotic & Electrotherapy units
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "0.85rem", fontWeight: "600" }}>
            <span>CLINICAL TIME RECLAIMED</span>
            <TrendingUp size={18} color="#7c3aed" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#7c3aed", marginTop: "8px" }}>
            {Math.round(summary.totalReclaimedMinutes)} <span style={{ fontSize: "1rem", fontWeight: "600" }}>mins</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
            Saved through early robotic completion
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "0.85rem", fontWeight: "600" }}>
            <span>DAILY SHIFTS RECORDED</span>
            <Calendar size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
            {historyData?.dailyStats?.length || 1}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
            Permanent date-stamped logs
          </div>
        </div>
      </div>

      {/* FILTER & TABS TOOLBAR */}
      <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        {/* TABS */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("PATIENTS")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: activeTab === "PATIENTS" ? "1px solid #059669" : "1px solid #e2e8f0",
              background: activeTab === "PATIENTS" ? "#ecfdf5" : "#ffffff",
              color: activeTab === "PATIENTS" ? "#065f46" : "#475569",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            👥 Patient Archive ({filteredPatients.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SESSIONS")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: activeTab === "SESSIONS" ? "1px solid #2563eb" : "1px solid #e2e8f0",
              background: activeTab === "SESSIONS" ? "#eff6ff" : "#ffffff",
              color: activeTab === "SESSIONS" ? "#1e40af" : "#475569",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            ⏱️ Sessions Log ({filteredSessions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DAILY_STATS")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: activeTab === "DAILY_STATS" ? "1px solid #7c3aed" : "1px solid #e2e8f0",
              background: activeTab === "DAILY_STATS" ? "#f5f3ff" : "#ffffff",
              color: activeTab === "DAILY_STATS" ? "#5b21b6" : "#475569",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            📅 Daily Shift Breakdown
          </button>
        </div>

        {/* DATE FILTER & SEARCH */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "#334155",
              cursor: "pointer"
            }}
          >
            <option value="ALL">All Dates (Full History)</option>
            <option value="TODAY">Today ({todayStr})</option>
            <option value="YESTERDAY">Yesterday ({yesterdayStr})</option>
          </select>

          <div style={{ position: "relative", minWidth: "220px" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search historical records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
          </div>
        </div>
      </div>

      {/* TAB CONTENT: 1. PATIENT ARCHIVE */}
      {activeTab === "PATIENTS" && (
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>
              Permanent Patient Registration Archive
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Showing {filteredPatients.length} record(s)
            </span>
          </div>

          {filteredPatients.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
              <AlertCircle size={32} style={{ margin: "0 auto 10px", color: "#94a3b8" }} />
              <p style={{ margin: 0, fontWeight: "600" }}>No patient records found for the selected filter.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 18px" }}>Registration Date</th>
                    <th style={{ padding: "12px 18px" }}>Patient Code</th>
                    <th style={{ padding: "12px 18px" }}>Name / Age</th>
                    <th style={{ padding: "12px 18px" }}>Condition</th>
                    <th style={{ padding: "12px 18px" }}>Care Setting</th>
                    <th style={{ padding: "12px 18px" }}>Machines Assigned</th>
                    <th style={{ padding: "12px 18px" }}>Archive Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p) => {
                    const isArchived = p.status === "ARCHIVED";
                    const isCompleted = p.status === "COMPLETED";
                    const isWard = p.careSetting === "WARD" || Boolean(p.wardInfo);

                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 18px", color: "#64748b", fontFamily: "monospace" }}>
                          {(p.createdAt || "").slice(0, 10) || "Today"}
                        </td>
                        <td style={{ padding: "12px 18px", fontWeight: "700", color: "#0f172a" }}>
                          {p.patientCode}
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <strong style={{ color: "#0f172a" }}>{p.name}</strong>
                          <span style={{ color: "#64748b", marginLeft: "6px" }}>({p.age} yrs)</span>
                        </td>
                        <td style={{ padding: "12px 18px", color: "#334155" }}>
                          {p.condition}
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          {isWard ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: "#fef3c7", color: "#92400e", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "600" }}>
                              <BedDouble size={13} /> {p.wardInfo || "In-Ward (1:9)"}
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: "#f0fdf4", color: "#166534", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "600" }}>
                              <Building2 size={13} /> In-Department (1:6)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <span style={{ color: "#475569", fontWeight: "600" }}>
                            {Array.isArray(p.requiredMachines) ? p.requiredMachines.join(", ") : p.requiredMachines}
                          </span>
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          {isArchived ? (
                            <span style={{ padding: "4px 10px", background: "#f1f5f9", color: "#475569", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700" }}>
                              ARCHIVED (HISTORY)
                            </span>
                          ) : isCompleted ? (
                            <span style={{ padding: "4px 10px", background: "#dcfce7", color: "#15803d", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700" }}>
                              COMPLETED
                            </span>
                          ) : (
                            <span style={{ padding: "4px 10px", background: "#e0f2fe", color: "#0369a1", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700" }}>
                              ACTIVE QUEUE
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 2. SESSIONS LOG */}
      {activeTab === "SESSIONS" && (
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>
              Clinical Therapy Session History & Reclaim Log
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Showing {filteredSessions.length} session(s)
            </span>
          </div>

          {filteredSessions.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
              <AlertCircle size={32} style={{ margin: "0 auto 10px", color: "#94a3b8" }} />
              <p style={{ margin: 0, fontWeight: "600" }}>No sessions recorded for the selected filter.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 18px" }}>Date & Time</th>
                    <th style={{ padding: "12px 18px" }}>Patient</th>
                    <th style={{ padding: "12px 18px" }}>Machine</th>
                    <th style={{ padding: "12px 18px" }}>Assigned Therapist</th>
                    <th style={{ padding: "12px 18px" }}>Duration</th>
                    <th style={{ padding: "12px 18px" }}>Reclaimed Time</th>
                    <th style={{ padding: "12px 18px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 18px", color: "#64748b", fontFamily: "monospace" }}>
                        {s.started_at ? new Date(s.started_at).toLocaleString() : "Today"}
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        <strong style={{ color: "#0f172a" }}>{s.patient_name}</strong>
                        <span style={{ color: "#64748b", marginLeft: "6px" }}>({s.patient_code})</span>
                      </td>
                      <td style={{ padding: "12px 18px", color: "#2563eb", fontWeight: "600" }}>
                        {s.machine_name} <span style={{ color: "#64748b", fontSize: "0.8rem" }}>({s.machine_id})</span>
                      </td>
                      <td style={{ padding: "12px 18px", color: "#059669", fontWeight: "600" }}>
                        {s.therapist_name}
                      </td>
                      <td style={{ padding: "12px 18px", color: "#334155" }}>
                        {s.duration} mins
                      </td>
                      <td style={{ padding: "12px 18px", color: "#7c3aed", fontWeight: "700" }}>
                        {s.reclaimed_minutes ? `+${s.reclaimed_minutes} mins` : "0 mins"}
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        <span style={{ padding: "4px 8px", background: s.status === "COMPLETED" ? "#dcfce7" : "#fef3c7", color: s.status === "COMPLETED" ? "#166534" : "#92400e", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700" }}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. DAILY SHIFT BREAKDOWN */}
      {activeTab === "DAILY_STATS" && (
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>
              Daily Hospital Shift Summary
            </h3>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 18px" }}>Shift Date</th>
                  <th style={{ padding: "12px 18px" }}>Total Patients</th>
                  <th style={{ padding: "12px 18px" }}>Sessions Completed</th>
                  <th style={{ padding: "12px 18px" }}>Total Reclaimed Minutes</th>
                </tr>
              </thead>
              <tbody>
                {(historyData?.dailyStats || []).map((d) => (
                  <tr key={d.date} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 18px", fontWeight: "700", color: "#0f172a" }}>
                      📅 {d.date} {d.date === todayStr ? "(Today)" : ""}
                    </td>
                    <td style={{ padding: "12px 18px", color: "#059669", fontWeight: "700" }}>
                      {d.patientCount} patients
                    </td>
                    <td style={{ padding: "12px 18px", color: "#2563eb", fontWeight: "700" }}>
                      {d.completedSessions} sessions
                    </td>
                    <td style={{ padding: "12px 18px", color: "#7c3aed", fontWeight: "700" }}>
                      +{Math.round(d.reclaimedMinutes)} mins
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
