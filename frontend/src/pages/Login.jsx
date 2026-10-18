import { useState } from "react";
import {
  Activity,
  Lock,
  User,
  ShieldCheck,
  HeartPulse,
  AlertCircle,
  KeyRound,
  UserPlus,
  CheckCircle2
} from "lucide-react";
import { apiService } from "../api/apiService";

// Fallback hospital staff credentials if offline
const AUTHORIZED_STAFF = [
  {
    username: "admin",
    password: "admin123",
    name: "System Administrator",
    role: "Chief Clinical Admin",
    department: "PMR Directorate",
    avatar: "AD"
  },
  {
    username: "karthikeyan",
    password: "pmr2026",
    name: "Mr. Karthikeyan.S",
    role: "Senior Physiotherapist",
    department: "Physiotherapy",
    avatar: "KS"
  },
  {
    username: "arul",
    password: "pmr2026",
    name: "Mrs. Arul Abirami.G",
    role: "Lead Occupational Therapist",
    department: "Occupational Therapy",
    avatar: "AA"
  },
  {
    username: "yazhini",
    password: "pmr2026",
    name: "Ms. Yazhini",
    role: "Clinical Psychologist",
    department: "Psychology",
    avatar: "YZ"
  },
  {
    username: "rithika",
    password: "pmr2026",
    name: "Ms. Rithika.R",
    role: "Audiologist & SLP",
    department: "Speech & Audiology",
    avatar: "RR"
  },
  {
    username: "nurse",
    password: "pmr2026",
    name: "Sister Revathi",
    role: "Staff Nurse / Triage Officer",
    department: "Nursing & Triage",
    avatar: "SN"
  }
];

function Login({ onLogin }) {
  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'register'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration state
  const [regForm, setRegForm] = useState({
    staffId: "",
    name: "",
    password: "",
    role: "Physiotherapist",
    department: "Physiotherapy",
    room: "",
    phone: ""
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError("Please enter both Staff ID / Username and Password.");
      return;
    }

    setLoading(true);
    try {
      // Authenticate against real-time SQLite database
      const res = await apiService.login(trimmedUser, trimmedPass);
      if (res.success && res.user) {
        if (onLogin) onLogin(res.user);
        return;
      }
    } catch (apiErr) {
      if (apiErr.message && !apiErr.message.includes("Failed to fetch") && !apiErr.message.includes("NetworkError")) {
        setError(apiErr.message);
        setLoading(false);
        return;
      }
      // Fallback if backend offline
      const staff = AUTHORIZED_STAFF.find(
        (account) =>
          account.username.toLowerCase() === trimmedUser.toLowerCase() &&
          account.password === trimmedPass
      );
      if (staff) {
        if (onLogin) onLogin(staff);
      } else {
        setError("Invalid credentials! Access denied. Please check your Staff ID and Password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setRegisterSuccess("");

    if (!regForm.staffId.trim() || !regForm.name.trim() || !regForm.password.trim()) {
      setError("Staff ID, Full Name, and Password are required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.createStaff(regForm);
      if (res.success) {
        setRegisterSuccess(`Staff ID '${regForm.staffId}' registered successfully! Logging you in...`);
        // Automatic login for new staff
        setTimeout(async () => {
          try {
            const loginRes = await apiService.login(regForm.staffId.trim(), regForm.password.trim());
            if (loginRes.success && loginRes.user && onLogin) {
              onLogin(loginRes.user);
            }
          } catch {
            setActiveTab("login");
            setUsername(regForm.staffId);
            setPassword(regForm.password);
            setRegisterSuccess("");
          }
        }, 1200);
      }
    } catch (err) {
      setError(err.message || "Failed to create staff account.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError("");
    setLoading(true);

    try {
      const res = await apiService.login(user, pass);
      if (res.success && res.user && onLogin) {
        onLogin(res.user);
        return;
      }
    } catch {
      const staff = AUTHORIZED_STAFF.find(
        (account) =>
          account.username.toLowerCase() === user.toLowerCase() &&
          account.password === pass
      );
      if (staff && onLogin) {
        onLogin(staff);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hospital-login">
      {/* LEFT BRANDING PANEL */}
      <div className="login-brand-panel">
        <div className="brand-content">
          <div className="brand-logo">
            <div className="brand-logo-icon">
              <HeartPulse size={30} />
            </div>

            <div>
              <h1>IPMR CARE</h1>
              <span>INSTITUTE OF PHYSICAL MEDICINE & REHABILITATION</span>
            </div>
          </div>

          <div className="brand-message">
            <span className="brand-label">CLINICAL RESOURCE & ROSTER ENGINE</span>

            <h2>
              Precision Care.
              <br />
              Optimal Recovery.
            </h2>

            <p>
              Integrated resource control for 14 rehabilitation machines, 50 certified clinicians, and dynamic patient queue management.
            </p>
          </div>

          <div className="care-features">
            <div className="care-feature">
              <div className="feature-icon">
                <Activity size={18} />
              </div>

              <div>
                <strong>Dynamic Machine Scheduling</strong>
                <span>Real-time equipment allocation and time-reclamation tracking.</span>
              </div>
            </div>

            <div className="care-feature">
              <div className="feature-icon">
                <ShieldCheck size={18} />
              </div>

              <div>
                <strong>Role-Based Clinical Access</strong>
                <span>Secure authentication for therapists, doctors, and department administration.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="brand-footer">
          <span>IPMR SCHEDULER v2.0</span>
          <span>•</span>
          <span>CLINICAL OPERATIONS PLATFORM</span>
        </div>
      </div>

      {/* RIGHT LOGIN PANEL */}
      <div className="login-form-panel">
        <div className="login-container">
          {/* TAB SWITCHER: SIGN IN vs CREATE NEW STAFF */}
          <div className="login-tab-switcher">
            <button
              type="button"
              className={activeTab === "login" ? "login-tab active" : "login-tab"}
              onClick={() => {
                setActiveTab("login");
                setError("");
                setRegisterSuccess("");
              }}
            >
              <User size={15} />
              <span>Staff Sign In</span>
            </button>

            <button
              type="button"
              className={activeTab === "register" ? "login-tab active" : "login-tab"}
              onClick={() => {
                setActiveTab("register");
                setError("");
                setRegisterSuccess("");
              }}
            >
              <UserPlus size={15} />
              <span>+ Create Staff ID</span>
            </button>
          </div>

          <div className="login-heading">
            <span className="portal-badge">
              {activeTab === "login" ? "SECURE CLINICAL ACCESS" : "NEW CLINICIAN ENROLLMENT"}
            </span>

            <h2>{activeTab === "login" ? "Staff Sign In" : "Create New Staff ID"}</h2>

            <p>
              {activeTab === "login"
                ? "Enter authorized credentials to manage hospital rehabilitation workflows."
                : "Register a real-time clinical staff profile with database credentials."}
            </p>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="login-error-alert">
              <AlertCircle size={18} />
              <div>
                <strong>Authentication Notice</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* SUCCESS ALERT */}
          {registerSuccess && (
            <div className="login-success-alert">
              <CheckCircle2 size={18} />
              <span>{registerSuccess}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === "login" && (
            <>
              <form onSubmit={handleLogin}>
                <div className="hospital-input-group">
                  <label>Staff ID / Username *</label>

                  <div className="hospital-input">
                    <User size={17} />
                    <input
                      type="text"
                      placeholder="e.g. admin or karthikeyan"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (error) setError("");
                      }}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="hospital-input-group">
                  <label>Password *</label>

                  <div className="hospital-input">
                    <Lock size={17} />
                    <input
                      type="password"
                      placeholder="Enter staff password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                    />
                  </div>
                </div>

                <div className="login-options">
                  <label className="remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember this workstation</span>
                  </label>

                  <span className="ssl-badge">
                    <ShieldCheck size={13} />
                    256-Bit SSL
                  </span>
                </div>

                <button type="submit" className="hospital-login-button" disabled={loading}>
                  <span>{loading ? "Verifying Credentials..." : "Sign In to Clinical Portal"}</span>
                  <span className="button-arrow">→</span>
                </button>
              </form>

              {/* QUICK DEMO CREDENTIALS */}
              <div className="demo-credentials-box">
                <div className="demo-credentials-title">
                  <KeyRound size={13} />
                  <span>Quick Demo Accounts</span>
                </div>

                <div className="demo-accounts-grid">
                  <button
                    type="button"
                    className="demo-account-pill admin"
                    onClick={() => handleQuickLogin("admin", "admin123")}
                    title="Sign in as Administrator"
                  >
                    <div className="pill-header">
                      <span className="pill-dot admin-dot"></span>
                      <strong>Admin</strong>
                    </div>
                    <small>admin123</small>
                  </button>

                  <button
                    type="button"
                    className="demo-account-pill nurse"
                    onClick={() => handleQuickLogin("nurse", "pmr2026")}
                    title="Sign in as Staff Nurse (Triage Desk)"
                  >
                    <div className="pill-header">
                      <span className="pill-dot nurse-dot"></span>
                      <strong>Staff Nurse</strong>
                    </div>
                    <small>nurse</small>
                  </button>

                  <button
                    type="button"
                    className="demo-account-pill pt"
                    onClick={() => handleQuickLogin("karthikeyan", "pmr2026")}
                    title="Sign in as Senior PT"
                  >
                    <div className="pill-header">
                      <span className="pill-dot pt-dot"></span>
                      <strong>Senior PT</strong>
                    </div>
                    <small>karthikeyan</small>
                  </button>

                  <button
                    type="button"
                    className="demo-account-pill ot"
                    onClick={() => handleQuickLogin("arul", "pmr2026")}
                    title="Sign in as Lead OT"
                  >
                    <div className="pill-header">
                      <span className="pill-dot ot-dot"></span>
                      <strong>Lead OT</strong>
                    </div>
                    <small>arul</small>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: REGISTER NEW STAFF FORM */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister}>
              <div className="hospital-input-group">
                <label>New Staff ID / Username *</label>
                <div className="hospital-input">
                  <User size={17} />
                  <input
                    type="text"
                    placeholder="e.g. PT-051 or suresh"
                    value={regForm.staffId}
                    onChange={(e) => setRegForm({ ...regForm, staffId: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="hospital-input-group">
                <label>Clinician Full Name *</label>
                <div className="hospital-input">
                  <UserPlus size={17} />
                  <input
                    type="text"
                    placeholder="e.g. Dr. Suresh Kumar"
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="hospital-input-group">
                <label>Department *</label>
                <select
                  className="hospital-select"
                  value={regForm.department}
                  onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                >
                  <option value="Physiotherapy">Physiotherapy</option>
                  <option value="Occupational Therapy">Occupational Therapy</option>
                  <option value="Nursing & Triage">Nursing & Triage Station</option>
                  <option value="Speech & Audiology">Speech & Audiology</option>
                  <option value="Psychology">Psychology</option>
                </select>
              </div>

              <div className="hospital-input-group">
                <label>Designation / Role</label>
                <div className="hospital-input">
                  <input
                    type="text"
                    placeholder="e.g. Senior Physiotherapist"
                    value={regForm.role}
                    onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                  />
                </div>
              </div>

              <div className="hospital-input-group">
                <label>Password *</label>
                <div className="hospital-input">
                  <Lock size={17} />
                  <input
                    type="password"
                    placeholder="Create secure staff password"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="hospital-login-button" disabled={loading}>
                <UserPlus size={16} />
                <span>{loading ? "Creating Account..." : "Create Staff ID & Sign In"}</span>
              </button>
            </form>
          )}

          <div className="secure-login">
            <ShieldCheck size={15} />
            <span>Institute of Physical Medicine and Rehabilitation • IPMR Protected</span>
          </div>

          <div className="login-bottom">
            <span>IPMR OS v2.4</span>
            <span>© 2026 Department of Physical Medicine & Rehab</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;