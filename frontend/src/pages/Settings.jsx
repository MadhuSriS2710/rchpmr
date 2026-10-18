import { useState } from "react";
import {
  Save,
  RotateCcw,
  ShieldCheck,
  Bell,
  Cpu,
  Building,
  CheckCircle2,
  Download,
  Database,
  AlertTriangle
} from "lucide-react";

function Settings({
  currentUser,
  onResetScheduler,
  onLogout
}) {
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [settings, setSettings] = useState({
    // Facility
    instituteName: "Institute of Physical Medicine and Rehabilitation (IPMR)",
    facilityCode: "IPMR-CH-01",
    operatingHoursStart: "08:00",
    operatingHoursEnd: "20:00",
    bufferTimeMinutes: "5",

    // Engine
    autonomousScheduler: true,
    strictPriorityBoost: true,
    earlyReclaimEngine: true,
    maxSessionsPerPatient: "1",
    autoAssignTherapist: true,

    // Notifications
    soundAlerts: false,
    machineAvailableAlert: true,
    earlyCompletionAlert: true,
    treatmentCompleteAlert: true,

    // Security
    sessionTimeout: "30",
    twoFactorAuth: false
  });

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value
    }));
    setSaveSuccess(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 4000);
  };

  const handleExportData = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "ipmr_system_config.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="settings-page">
      {/* HEADER */}
      <div className="settings-header">
        <div>
          <span className="page-label">
            INSTITUTE OF PHYSICAL MEDICINE AND REHABILITATION
          </span>
          <h1>System & Clinical Settings</h1>
          <p>
            Configure scheduling engine algorithms, department operating hours, clinician assignment rules, and security.
          </p>
        </div>

        <div className="settings-actions">
          <a
            href="/api/database/backup"
            download
            className="export-config-btn"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Download full SQLite database backup (.db file)"
          >
            <Database size={15} />
            Download Database (.db)
          </a>

          <a
            href="/api/export/patients"
            download
            className="export-config-btn"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Download all registered patients as Excel-compatible CSV"
          >
            <Download size={15} />
            Export Patients (CSV)
          </a>

          <button
            type="button"
            className="export-config-btn"
            onClick={handleExportData}
          >
            <Download size={15} />
            Export Config
          </button>

          <button
            type="button"
            className="save-settings-btn"
            onClick={handleSave}
          >
            <Save size={15} />
            Save Changes
          </button>
        </div>
      </div>

      {/* TOAST SUCCESS NOTIFICATION */}
      {saveSuccess && (
        <div className="settings-saved-banner">
          <CheckCircle2 size={18} />
          <div>
            <strong>Settings Saved Successfully!</strong>
            <p>All clinical rules, algorithm thresholds, and security preferences have been updated.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="settings-form-grid">
        {/* SECTION 1: FACILITY & OPERATING HOURS */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="card-icon facility">
              <Building size={18} />
            </div>
            <div>
              <h2>Facility & Operating Standards</h2>
              <span>Institute identity and operational timings</span>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="setting-field">
              <label>Institute Name</label>
              <input
                type="text"
                value={settings.instituteName}
                onChange={(e) => handleChange("instituteName", e.target.value)}
              />
            </div>

            <div className="setting-row-2">
              <div className="setting-field">
                <label>Department Code</label>
                <input
                  type="text"
                  value={settings.facilityCode}
                  onChange={(e) => handleChange("facilityCode", e.target.value)}
                />
              </div>

              <div className="setting-field">
                <label>Buffer Between Patients (Min)</label>
                <select
                  value={settings.bufferTimeMinutes}
                  onChange={(e) => handleChange("bufferTimeMinutes", e.target.value)}
                >
                  <option value="0">0 Min (Direct Next)</option>
                  <option value="5">5 Minutes (Recommended)</option>
                  <option value="10">10 Minutes (Sanitization)</option>
                  <option value="15">15 Minutes (Complex Care)</option>
                </select>
              </div>
            </div>

            <div className="setting-row-2">
              <div className="setting-field">
                <label>Shift Start Time</label>
                <input
                  type="time"
                  value={settings.operatingHoursStart}
                  onChange={(e) => handleChange("operatingHoursStart", e.target.value)}
                />
              </div>

              <div className="setting-field">
                <label>Shift End Time</label>
                <input
                  type="time"
                  value={settings.operatingHoursEnd}
                  onChange={(e) => handleChange("operatingHoursEnd", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: SCHEDULING ENGINE PARAMETERS */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="card-icon engine">
              <Cpu size={18} />
            </div>
            <div>
              <h2>Scheduler Engine Rules</h2>
              <span>Autonomous routing algorithm and priority weighting</span>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="toggle-setting-row">
              <div>
                <strong>Autonomous Scheduling Cycle</strong>
                <span>Automatically run allocation cycle upon session completion</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.autonomousScheduler}
                  onChange={(e) => handleChange("autonomousScheduler", e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="toggle-setting-row">
              <div>
                <strong>Strict Sequencing Priority Boost (+20)</strong>
                <span>Grant additional queue priority to patients with dependent therapy chains</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.strictPriorityBoost}
                  onChange={(e) => handleChange("strictPriorityBoost", e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="toggle-setting-row">
              <div>
                <strong>Time Reclaim Engine (Early Completion)</strong>
                <span>Calculate reclaimed idle minutes when therapy is concluded early</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.earlyReclaimEngine}
                  onChange={(e) => handleChange("earlyReclaimEngine", e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="toggle-setting-row">
              <div>
                <strong>Auto-Assign Matching Clinician</strong>
                <span>Automatically pair available Physiotherapist or OT based on machine type</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.autoAssignTherapist}
                  onChange={(e) => handleChange("autoAssignTherapist", e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 3: STAFF & CLINICAL ALERTS */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="card-icon alerts">
              <Bell size={18} />
            </div>
            <div>
              <h2>Clinical Notification Triggers</h2>
              <span>Real-time event feeds and workstation popups</span>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="toggle-setting-row">
              <div>
                <strong>Machine Availability Alerts</strong>
                <span>Notify staff immediately when an equipment finishes treatment</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.machineAvailableAlert}
                  onChange={(e) => handleChange("machineAvailableAlert", e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="toggle-setting-row">
              <div>
                <strong>Early Completion Notifications</strong>
                <span>Trigger toast and record reclaimed minutes into clinical metrics</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.earlyCompletionAlert}
                  onChange={(e) => handleChange("earlyCompletionAlert", e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="toggle-setting-row">
              <div>
                <strong>Complete Route Discharge Notification</strong>
                <span>Alert when a patient finishes all prescribed machines</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.treatmentCompleteAlert}
                  onChange={(e) => handleChange("treatmentCompleteAlert", e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 4: USER ACCOUNT & SECURITY */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="card-icon security">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2>Account & Security Profile</h2>
              <span>Current session and credential protection</span>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="current-user-box">
              <div className="avatar-pill">
                {currentUser?.avatar || "AD"}
              </div>
              <div>
                <strong>{currentUser?.name || "Dr. Administrator"}</strong>
                <span>{currentUser?.role || "Chief Clinical Admin"} • {currentUser?.department || "PMR Directorate"}</span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  className="logout-action-btn"
                  onClick={onLogout}
                >
                  Log Out
                </button>
              )}
            </div>

            <div className="setting-field">
              <label>Workstation Inactivity Timeout</label>
              <select
                value={settings.sessionTimeout}
                onChange={(e) => handleChange("sessionTimeout", e.target.value)}
              >
                <option value="15">15 Minutes (Strict Clinical Mode)</option>
                <option value="30">30 Minutes (Recommended)</option>
                <option value="60">1 Hour</option>
                <option value="never">Never (Kiosk / Board Mode)</option>
              </select>
            </div>

            <div className="toggle-setting-row">
              <div>
                <strong>Two-Factor Staff Verification</strong>
                <span>Require biometric / SMS OTP for prescription overrides</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) => handleChange("twoFactorAuth", e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>
      </form>

      {/* SYSTEM MAINTENANCE PANEL */}
      <div className="maintenance-card">
        <div className="maintenance-header">
          <div className="maintenance-icon">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3>Simulation Maintenance & Queue Reset</h3>
            <p>Use during clinical shift handover or to restart the autonomous scheduling cycle.</p>
          </div>
        </div>

        <div className="maintenance-actions">
          <button
            type="button"
            className="reset-simulation-btn"
            onClick={() => {
              if (onResetScheduler) {
                onResetScheduler();
              }
              setSaveSuccess(true);
            }}
          >
            <RotateCcw size={15} />
            Reset Today's Queue & Re-run Scheduler
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
