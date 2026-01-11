import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { sessionManager } from "../utils/sessionManager";
import "./Auth.css";

export default function Login({ onSwitchToSignup }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, enterGuestMode } = useAuth();

  useEffect(() => {
    const theme = sessionManager.getSetting('theme');
    document.documentElement.className = theme;

    const cleanup = sessionManager.listenToSystemThemeChange((systemTheme) => {
      if (!localStorage.getItem('careerbot_settings')) {
        document.documentElement.className = systemTheme;
      }
    });

    return cleanup;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    enterGuestMode();
  };

  return (
    <div className="auth-modal">
      <h2>{t('login.title')}</h2>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label htmlFor="login-email">{t('login.email')}</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@example.com"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="login-password">{t('login.password')}</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            minLength={6}
          />
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? t('login.loggingIn') : t('login.login')}
        </button>
      </form>

      <button 
        type="button" 
        onClick={handleGuestMode} 
        className="auth-guest-btn"
        style={{
          marginTop: '1rem',
          width: '100%',
          padding: '0.75rem',
          backgroundColor: 'transparent',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.95rem',
          color: 'var(--text-color)'
        }}
      >
        🚀 Try as Guest
      </button>

      <div className="auth-switch">
        <span>{t('login.noAccount')}</span>
        <button type="button" onClick={onSwitchToSignup} className="auth-link">
          {t('login.register')}
        </button>
      </div>
    </div>
  );
}

