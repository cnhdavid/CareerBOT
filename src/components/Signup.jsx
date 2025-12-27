import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import "./Auth.css";

export default function Signup({ onSwitchToLogin }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t('signup.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('signup.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
    } catch (err) {
      setError(err.message || t('signup.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal">
      <h2>{t('signup.title')}</h2>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label htmlFor="signup-email">{t('signup.email')}</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@example.com"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-password">{t('signup.password')}</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={t('signup.passwordPlaceholder')}
            minLength={6}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-confirm">{t('signup.confirmPassword')}</label>
          <input
            id="signup-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder={t('signup.confirmPlaceholder')}
            minLength={6}
          />
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? t('signup.registering') : t('signup.register')}
        </button>
      </form>

      <div className="auth-switch">
        <span>{t('signup.haveAccount')}</span>
        <button type="button" onClick={onSwitchToLogin} className="auth-link">
          {t('signup.login')}
        </button>
      </div>
    </div>
  );
}

