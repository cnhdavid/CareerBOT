import {
  Home,
  Compass,
  Layers,
  User,
  Settings,
  Sparkles,
  X,
  LogOut
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";

export default function Sidebar({ open, onClose, onSettings }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
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
          <span className="label">{t('sidebar.home')}</span>
        </button>

        <button className="sidebar-item">
          <Compass size={18} />
          <span className="label">{t('sidebar.discover')}</span>
        </button>

        <button className="sidebar-item">
          <Layers size={18} />
          <span className="label">{t('sidebar.rooms')}</span>
        </button>

      </nav>

      {/* BOTTOM */}
      <div className="sidebar-bottom">
        <div className="sidebar-item" style={{ cursor: "default", gridTemplateColumns: "24px 1fr" }}>
          <User size={18} />
          <span className="label" style={{ fontSize: "12px" }}>
            {user?.email}
          </span>
        </div>

        <button className="sidebar-item" onClick={onSettings}>
          <Settings size={18} />
          <span className="label">{t('sidebar.settings')}</span>
        </button>

        <button className="sidebar-item" onClick={logout}>
          <LogOut size={18} />
          <span className="label">{t('sidebar.logout')}</span>
        </button>
      </div>

    </aside>
  );
}
