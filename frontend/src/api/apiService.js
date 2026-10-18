// =========================================================
// INSTITUTE OF PHYSICAL MEDICINE AND REHABILITATION (IPMR)
// REAL-TIME API CLIENT SERVICE
// =========================================================

const API_BASE = "/api";

export const apiService = {
  // -------------------------------------------------------
  // HEALTH CHECK
  // -------------------------------------------------------
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch (err) {
      console.warn("Backend server offline, running in client memory mode.", err);
      return null;
    }
  },

  // -------------------------------------------------------
  // AUTHENTICATION & REAL-TIME STAFF ID CREATION
  // -------------------------------------------------------
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Authentication failed.");
    }
    if (data.token) {
      localStorage.setItem("ipmr_token", data.token);
    }
    return data;
  },

  async createStaff(staffData) {
    const res = await fetch(`${API_BASE}/auth/create-staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staffData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to create Staff ID.");
    }
    return data;
  },

  // -------------------------------------------------------
  // THERAPISTS / CLINICIANS
  // -------------------------------------------------------
  async getTherapists() {
    try {
      const res = await fetch(`${API_BASE}/therapists`);
      if (!res.ok) throw new Error("Failed to fetch therapists.");
      return await res.json();
    } catch (err) {
      console.warn("Could not load therapists from backend:", err.message);
      return null;
    }
  },

  async updateTherapist(id, updateData) {
    try {
      const res = await fetch(`${API_BASE}/therapists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      return await res.json();
    } catch (err) {
      console.warn("Could not update therapist on backend:", err.message);
      return null;
    }
  },

  // -------------------------------------------------------
  // MACHINES
  // -------------------------------------------------------
  async getMachines() {
    try {
      const res = await fetch(`${API_BASE}/machines`);
      if (!res.ok) throw new Error("Failed to fetch machines.");
      return await res.json();
    } catch (err) {
      console.warn("Could not load machines from backend:", err.message);
      return null;
    }
  },

  async updateMachine(id, updateData) {
    try {
      const res = await fetch(`${API_BASE}/machines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      return await res.json();
    } catch (err) {
      console.warn("Could not update machine on backend:", err.message);
      return null;
    }
  },

  // -------------------------------------------------------
  // PATIENTS
  // -------------------------------------------------------
  async getPatients(scope = "active") {
    try {
      const res = await fetch(`${API_BASE}/patients?scope=${encodeURIComponent(scope)}`);
      if (!res.ok) throw new Error("Failed to fetch patients.");
      return await res.json();
    } catch (err) {
      console.warn("Could not load patients from backend:", err.message);
      return null;
    }
  },

  async addPatient(patientData) {
    const res = await fetch(`${API_BASE}/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patientData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add patient.");
    return data;
  },

  async updatePatient(patientCode, updateData) {
    try {
      const res = await fetch(`${API_BASE}/patients/${patientCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      return await res.json();
    } catch (err) {
      console.warn("Could not update patient on backend:", err.message);
      return null;
    }
  },

  async deletePatient(patientCode) {
    try {
      const res = await fetch(`${API_BASE}/patients/${patientCode}`, {
        method: "DELETE"
      });
      return await res.json();
    } catch (err) {
      console.warn("Could not delete patient on backend:", err.message);
      return null;
    }
  },

  async clearAllPatients() {
    try {
      const res = await fetch(`${API_BASE}/patients`, {
        method: "DELETE"
      });
      return await res.json();
    } catch (err) {
      console.warn("Could not clear all patients on backend:", err.message);
      return null;
    }
  },

  // -------------------------------------------------------
  // LIVE SESSIONS
  // -------------------------------------------------------
  async getSessions() {
    try {
      const res = await fetch(`${API_BASE}/sessions`);
      if (!res.ok) throw new Error("Failed to fetch active sessions.");
      return await res.json();
    } catch (err) {
      console.warn("Could not load sessions from backend:", err.message);
      return null;
    }
  },

  async startSession(sessionData) {
    try {
      const res = await fetch(`${API_BASE}/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData)
      });
      return await res.json();
    } catch (err) {
      console.warn("Could not start session on backend:", err.message);
      return null;
    }
  },

  async completeSession(sessionId, early = false, reclaimedMinutes = 0) {
    try {
      const res = await fetch(`${API_BASE}/sessions/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, early, reclaimedMinutes })
      });
      return await res.json();
    } catch (err) {
      console.warn("Could not complete session on backend:", err.message);
      return null;
    }
  },

  // -------------------------------------------------------
  // SETTINGS & SYSTEM RESET
  // -------------------------------------------------------
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async saveSettings(settings) {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async resetData() {
    try {
      const res = await fetch(`${API_BASE}/reset-data`, {
        method: "POST"
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async startNewDayShift() {
    try {
      const res = await fetch(`${API_BASE}/shift/start-new-day`, {
        method: "POST"
      });
      return await res.json();
    } catch (err) {
      console.warn("Could not archive shift on backend:", err);
      return null;
    }
  },

  async getReportsHistory() {
    try {
      const res = await fetch(`${API_BASE}/reports/history`);
      if (!res.ok) throw new Error("Failed to load historical reports");
      return await res.json();
    } catch (err) {
      console.warn("Could not load history from backend:", err);
      return null;
    }
  },

  // -------------------------------------------------------
  // DOWNLOAD & EXPORT URLS
  // -------------------------------------------------------
  getDatabaseBackupUrl() {
    return `${API_BASE}/database/backup`;
  },

  getPatientsExportUrl() {
    return `${API_BASE}/export/patients`;
  },

  getSessionsExportUrl() {
    return `${API_BASE}/export/sessions`;
  }
};
