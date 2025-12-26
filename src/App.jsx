import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import SettingsModal from "./components/SettingsModal";
import Chat from "./components/Chat";
import Login from "./components/Login";
import Signup from "./components/Signup";
import { useAuth } from "./contexts/AuthContext";
import "./App.css";

const uid = () => crypto.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState("dark");

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Chatverlauf
  const [messages, setMessages] = useState([
    {
      id: uid(),
      role: "assistant",
      content:
        "Ich bin ein KI-gestützter virtueller Assistent, der entwickelt wurde, um Informationen bereitzustellen und Fragen zu beantworten. Wie kann ich dir helfen?",
    },
  ]);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    setInput("");

    const userMsg = { id: uid(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        // Wenn du im Backend den Verlauf als Kontext nutzen willst:
        body: JSON.stringify({
          message: text,
          messages: [...messages, userMsg],
        }),
      });

      const data = await res.json();
      const botText = data?.text || "Keine Antwort erhalten.";

      const botMsg = { id: uid(), role: "assistant", content: botText };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: "Netzwerkfehler. Bitte erneut versuchen.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="app-root" style={{ display: "grid", placeItems: "center" }}>
        <div>Laden...</div>
      </div>
    );
  }

  // Show login/signup if not authenticated
  if (!user) {
    return (
      <div className="app-root" style={{ display: "grid", placeItems: "center" }}>
        {showLogin ? (
          <Login onSwitchToSignup={() => setShowLogin(false)} />
        ) : (
          <Signup onSwitchToLogin={() => setShowLogin(true)} />
        )}
      </div>
    );
  }

  return (
    <div className="app-root">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSettings={() => setShowSettings(true)}
      />

      <div className="topbar">
        {!sidebarOpen && (
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
        )}
        <span className="mobile-brand">CareerBOT</span>
      </div>

      {sidebarOpen && (
        <div className="overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="main">
        <div className="desktop-center">
          <h1>Wobei kann ich helfen?</h1>

          <Chat
            messages={messages}
            input={input}
            setInput={setInput}
            loading={loading}
            onSend={handleSend}
          />
        </div>
      </main>

      {showSettings && (
        <SettingsModal
          theme={theme}
          setTheme={setTheme}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
