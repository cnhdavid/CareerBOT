import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./Auth.css";

export default function Signup({ onSwitchToLogin }) {
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
      setError("Passwörter stimmen nicht überein");
      return;
    }

    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
    } catch (err) {
      setError(err.message || "Registrierung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal">
      <h2>Registrieren</h2>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label htmlFor="signup-email">E-Mail</label>
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
          <label htmlFor="signup-password">Passwort</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Mindestens 6 Zeichen"
            minLength={6}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-confirm">Passwort bestätigen</label>
          <input
            id="signup-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Passwort wiederholen"
            minLength={6}
          />
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Wird registriert..." : "Registrieren"}
        </button>
      </form>

      <div className="auth-switch">
        <span>Bereits ein Konto? </span>
        <button type="button" onClick={onSwitchToLogin} className="auth-link">
          Anmelden
        </button>
      </div>
    </div>
  );
}

