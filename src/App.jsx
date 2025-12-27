import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "./components/Sidebar";
import SettingsModal from "./components/SettingsModal";
import ConversationsModal from "./components/ConversationsModal";
import Chat from "./components/Chat";
import Login from "./components/Login";
import Signup from "./components/Signup";
import { useAuth } from "./contexts/AuthContext";
import "./App.css";

const uid = () => crypto.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;

export default function App() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [theme, setTheme] = useState("dark");

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Chatverlauf
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const loadConversation = (conv) => {
    setConversationId(conv._id);
    setMessages(conv.messages.map(m => ({ id: uid(), ...m })));
  };

  const newChat = () => {
    setConversationId(null);
    setMessages([]);
  };

  const saveMessage = async (role, content) => {
    if (!conversationId) return;
    await fetch(`/api/conversations/${conversationId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ role, content }),
    });
  };
useEffect(() => {

  document.documentElement.className = theme;

}, [theme]);

useEffect(() => {

  if (user) {

    // Do not create a conversation until the first message is sent

  } else {

    setConversationId(null);

    setMessages([]);

  }

}, [user]);
  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    setInput("");
  
    if (!conversationId) {
      const res = await fetch("/api/conversations", { method: "POST", headers: getHeaders() });
      const conv = await res.json();
      setConversationId(conv._id);
    }
  
    const userMsg = { id: uid(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    await saveMessage("user", text);
  
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
      const botText = data?.text || t('app.noResponse');

      const botMsg = { id: uid(), role: "assistant", content: botText };
      setMessages((prev) => [...prev, botMsg]);
      await saveMessage("assistant", botText);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: t('app.networkError'),
        },
      ]);
      await saveMessage("assistant", t('app.networkError'));
    } finally {
      setLoading(false);
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="app-root" style={{ display: "grid", placeItems: "center" }}>
        <div>{t('app.loading')}</div>
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
        onConversations={() => setShowConversations(true)}
        onNewChat={newChat}
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
        <>
          <div className="overlay" onClick={() => setShowSettings(false)} />
          <SettingsModal
            theme={theme}
            setTheme={setTheme}
            onClose={() => setShowSettings(false)}
          />
        </>
      )}

      {showConversations && (
        <>
          <div className="overlay" onClick={() => setShowConversations(false)} />
          <ConversationsModal
            onClose={() => setShowConversations(false)}
            onLoadConversation={loadConversation}
          />
        </>
      )}
    </div>
  );
}
