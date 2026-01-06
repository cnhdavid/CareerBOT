import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "./components/Sidebar";
import SettingsModal from "./components/SettingsModal";
import ConversationsModal from "./components/ConversationsModal";
import ProfileModal from "./components/ProfileModal";
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
  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState("dark");

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Chatverlauf
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);

  const [topic, setTopic] = useState("Other");


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
    setTopic("Other");
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

  async function handleUpload(file) {
    if (loading) return;

    // Ensure we have a conversationId (upload should be linked)
    let convId = conversationId;
    if (!convId) {
      const res = await fetch("/api/conversations", { method: "POST", headers: getHeaders() });
      const conv = await res.json();
      convId = conv._id;
      setConversationId(convId);
    }

    // Show info message in chat
    const userMsg = { id: uid(), role: "user", content: `📎 Datei hochgeladen: ${file.name}` };
    setMessages((prev) => [...prev, userMsg]);

    // NOTE: saveMessage uses conversationId state; ensure it is set
    await fetch(`/api/conversations/${convId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ role: "user", content: userMsg.content }),
    });

    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("conversationId", convId);
      form.append("kind", "cv"); // MVP default

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.message ||
          data?.error ||
          "Upload fehlgeschlagen (ungültiges Format oder Serverfehler).";
        const botMsg = { id: uid(), role: "assistant", content: `⚠️ ${msg}` };
        setMessages((prev) => [...prev, botMsg]);

        await fetch(`/api/conversations/${convId}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ role: "assistant", content: botMsg.content }),
        });
        return;
      }

      const analysis = data?.analysisText || "Keine Analyse erhalten.";
      const botMsg = {
        id: uid(),
        role: "assistant",
        content: `✅ **Analyse (CV/Anschreiben)**\n\n${analysis}`,
      };

      setMessages((prev) => [...prev, botMsg]);

      await fetch(`/api/conversations/${convId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ role: "assistant", content: botMsg.content }),
      });
    } catch (e) {
      const botMsg = {
        id: uid(),
        role: "assistant",
        content: "⚠️ Upload/Analyse fehlgeschlagen (Network Error).",
      };
      setMessages((prev) => [...prev, botMsg]);

      await fetch(`/api/conversations/${convId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ role: "assistant", content: botMsg.content }),
      });
    } finally {
      setLoading(false);
    }
  }

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
        }),
      });

      const data = await res.json();
      const botText = data?.text || t('app.noResponse');

      setTopic(data?.topic || "Other");

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
        onProfile={() => setShowProfile(true)}
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
            topic={topic}
            onUpload={handleUpload}
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

      {showProfile && (
        <>
          <div className="overlay" onClick={() => setShowProfile(false)} />
          <ProfileModal onClose={() => setShowProfile(false)} />
        </>
      )}
    </div>
  );
}
