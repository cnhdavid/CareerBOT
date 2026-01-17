import {
  Home,
  Compass,
  Layers,
  User,
  Settings,
  Sparkles,
  X,
  LogOut,
  LogIn,
  UserPlus,
  History,
  Briefcase
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";

export default function Sidebar({ open, onClose, onSettings, onConversations, onRooms, onDiscover, onNewChat, onProfile, onLogin, onSignup, onInterview }) {
  const { t } = useTranslation();
  const { user, logout, isGuestMode, exitGuestMode } = useAuth();
  
  const handleLogin = () => {
    exitGuestMode();
    if (onLogin) onLogin();
  };
  
  const handleSignup = () => {
    exitGuestMode();
    if (onSignup) onSignup();
  };
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

        <button className="sidebar-item" onClick={onNewChat}>
          <Home size={18} />
          <span className="label">{t('sidebar.home')}</span>
        </button>

        <button className="sidebar-item" onClick={onDiscover}>
          <Compass size={18} />
          <span className="label">{t('sidebar.discover')}</span>
        </button>

        <button className="sidebar-item" onClick={onRooms}>
          <Layers size={18} />
          <span className="label">{t('sidebar.rooms')}</span>
        </button>

        <button className="sidebar-item" onClick={onConversations}>
          <History size={18} />
          <span className="label">{t('sidebar.conversations', { defaultValue: 'Conversations' })}</span>
        </button>

        <button className="sidebar-item" onClick={onInterview}>
          <Briefcase size={18} />
          <span className="label">{t('sidebar.interview', { defaultValue: 'Simulated Interview' })}</span>
        </button>

      </nav>

      {/* BOTTOM */}
      <div className="sidebar-bottom">
        {isGuestMode ? (
          <>
            <button className="sidebar-item" onClick={handleLogin} style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: '600'
            }}>
              <LogIn size={18} />
              <span className="label">{t('sidebar.login', { defaultValue: 'Login' })}</span>
            </button>

            <button className="sidebar-item" onClick={handleSignup}>
              <UserPlus size={18} />
              <span className="label">{t('sidebar.signup', { defaultValue: 'Sign Up' })}</span>
            </button>

            <button className="sidebar-item" onClick={onSettings}>
              <Settings size={18} />
              <span className="label">{t('sidebar.settings')}</span>
            </button>
          </>
        ) : (
          <>
            <button className="sidebar-item" onClick={onProfile} style={{ gridTemplateColumns: "24px 1fr" }}>
              <User size={18} />
              <span className="label" style={{ fontSize: "12px" }}>
                {user?.email}
              </span>
            </button>

            <button className="sidebar-item" onClick={onSettings}>
              <Settings size={18} />
              <span className="label">{t('sidebar.settings')}</span>
            </button>

            <button className="sidebar-item" onClick={logout}>
              <LogOut size={18} />
              <span className="label">{t('sidebar.logout')}</span>
            </button>
          </>
        )}
      </div>

    </aside>
  );
}
