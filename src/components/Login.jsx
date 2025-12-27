import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import "./Auth.css";

export default function Login({ onSwitchToSignup }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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

      <div className="auth-switch">
        <span>{t('login.noAccount')}</span>
        <button type="button" onClick={onSwitchToSignup} className="auth-link">
          {t('login.register')}
        </button>
      </div>
    </div>
  );
}

