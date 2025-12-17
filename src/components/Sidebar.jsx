import {
  Home,
  Compass,
  Layers,
  User,
  Settings,
  Sparkles,
  X
} from "lucide-react";

export default function Sidebar({ open, onClose, onSettings }) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>

      {/* HEADER */}
      <header className="sidebar-header">

        <div className="brand">
          <Sparkles size={18} />
          <span className="brand-text">CareerBOT</span>
        </div>

        {/* Mobile Close */}
        <button className="icon-btn mobile-only" onClick={onClose}>
          <X size={18} />
        </button>

      </header>

      {/* NAV */}
      <nav className="sidebar-nav">

        <button className="sidebar-item">
          <Home size={18} />
          <span className="label">Startseite</span>
        </button>

        <button className="sidebar-item">
          <Compass size={18} />
          <span className="label">Entdecken</span>
        </button>

        <button className="sidebar-item">
          <Layers size={18} />
          <span className="label">Räume</span>
        </button>

      </nav>

      {/* BOTTOM */}
      <div className="sidebar-bottom">

        <button className="sidebar-item">
          <User size={18} />
          <span className="label">Konto</span>
        </button>

        <button className="sidebar-item" onClick={onSettings}>
          <Settings size={18} />
          <span className="label">Einstellungen</span>
        </button>

      </div>

    </aside>
  );
}
