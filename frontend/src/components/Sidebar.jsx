import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Monitor,
  UserCheck,
  Settings,
  Activity,
  LogOut
} from "lucide-react";

function Sidebar({ activePage, setActivePage, onLogout }) {
  return (
    <aside className="sidebar">

      {/* Logo */}

      <div className="logo">

        <div className="logo-icon">
          <Activity size={22} />
        </div>

        <div>
          <h2>IPMR AI</h2>
          <span>REHABILITATION RESOURCE</span>
        </div>

      </div>


      {/* Navigation */}

      <nav className="navigation">

        <p className="menu-title">
          OPERATIONS
        </p>

        <button
          className={
            activePage === "Dashboard"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() => setActivePage("Dashboard")}
        >
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </button>

        <button
          className={
            activePage === "Patients"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() => setActivePage("Patients")}
        >
          <Users size={19} />
          <span>Patients</span>
        </button>

        <button
          className={
            activePage === "Schedule"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() => setActivePage("Schedule")}
        >
          <CalendarDays size={19} />
          <span>Schedule</span>
        </button>

        <button
          className={
            activePage === "Machines"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() => setActivePage("Machines")}
        >
          <Monitor size={19} />
          <span>Machines & Protocols</span>
        </button>

        <button
          className={
            activePage === "Therapists"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() => setActivePage("Therapists")}
        >
          <UserCheck size={19} />
          <span>Therapists</span>
          <span className="sidebar-badge">50</span>
        </button>


        <p className="menu-title system-title">
          SYSTEM
        </p>

        <button
          className={
            activePage === "Settings"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() => setActivePage("Settings")}
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>

      </nav>


      {/* Bottom status & Logout */}

      <div className="sidebar-bottom">

        <div className="system-status">

          <span className="online-dot"></span>

          <div>
            <strong>System Online</strong>
            <small>All services operational</small>
          </div>

        </div>

        {onLogout && (
          <button
            className="sidebar-logout-btn"
            onClick={onLogout}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        )}

      </div>

    </aside>
  );
}

export default Sidebar;