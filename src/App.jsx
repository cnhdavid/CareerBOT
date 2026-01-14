import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "./components/Sidebar";
import SettingsModal from "./components/SettingsModal";
import ConversationsModal from "./components/ConversationsModal";
import RoomsModal from "./components/RoomsModal";
import ProfileModal from "./components/ProfileModal";
import Chat from "./components/Chat";
import Login from "./components/Login";
import Signup from "./components/Signup";
import OpenAIDisclaimer from "./components/OpenAIDisclaimer";
import GuestModeIndicator from "./components/GuestModeIndicator";
import SignupCTA from "./components/SignupCTA";
import { useAuth } from "./hooks/useAuth";
import { sessionManager } from "./utils/sessionManager";
import { generateConversationTitle } from "@/lib/generateConversationTitle";
import "./App.css";

const uid = () => crypto.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;

export default function App() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, isGuestMode, exitGuestMode, showDisclaimer, handleDisclaimerAccept, handleDisclaimerDecline } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState('dark');

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Chatverlauf
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);

  const [topic, setTopic] = useState("Other");
  
  // Guest mode state
  const [showSignupCTA, setShowSignupCTA] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState(0);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    sessionManager.updateSetting('theme', newTheme);
  };

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    sessionManager.updateSetting('language', language);
  };


  const getHeaders = () => ({
    "Content-Type": "application/json",
  });

  const loadConversation = (conv) => {
    console.log("🔄 Loading conversation:", {
      conversationId: conv._id,
      roomId: conv.roomId,
      conversationName: conv.name,
      messageCount: conv.messages?.length
    });
    
    setConversationId(conv._id);
    setCurrentRoomId(conv.roomId || null);
    setMessages(conv.messages.map(m => ({ id: uid(), ...m })));
    
    // Save to localStorage for persistence
    localStorage.setItem("currentConversationId", conv._id);
    if (conv.roomId) {
      localStorage.setItem("currentRoomId", conv.roomId);
      console.log("✅ Set currentRoomId to:", conv.roomId);
    } else {
      localStorage.removeItem("currentRoomId");
      console.log("⚠️ No roomId found in conversation object");
    }
  };

  const newChat = () => {
    setConversationId(null);
    setCurrentRoomId(null);
    setMessages([]);
    setTopic("Other");
    setSelectedFile(null);
    
    // Clear localStorage
    localStorage.removeItem("currentConversationId");
    localStorage.removeItem("currentRoomId");
    
    // Close all open modals when going home
    setShowSettings(false);
    setShowConversations(false);
    setShowRooms(false);
    setShowProfile(false);
  };

  const saveMessageWithId = async (convId, role, content, documentId = null, filename = null) => {
    if (!convId) {
      console.log("❌ Cannot save message - no convId:", { role, content, convId });
      return;
    }
    console.log("💾 Saving message with ID:", { role, content, convId, documentId, filename });
    try {
      const messageData = { role, content };
      if (documentId) messageData.documentId = documentId;
      if (filename) messageData.filename = filename;
      
      const response = await fetch(`/api/conversations/${convId}`, {
        method: "PUT",
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify(messageData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Failed to save message:", errorData);
      } else {
        console.log("✅ Message saved successfully with ID");
      }
    } catch (error) {
      console.error("❌ Error saving message with ID:", error);
    }
  };
// Load theme from localStorage on client-side mount
useEffect(() => {
  const savedTheme = sessionManager.getSetting('theme');
  if (savedTheme) {
    setTheme(savedTheme);
  }
}, []);

useEffect(() => {
  document.documentElement.className = theme;
}, [theme]);

useEffect(() => {
  const savedLanguage = sessionManager.getSetting('language');
  if (savedLanguage && i18n.language !== savedLanguage) {
    i18n.changeLanguage(savedLanguage);
  }
}, [i18n]);

useEffect(() => {

  if (user) {
    // Restore last active conversation from localStorage
    const savedConversationId = localStorage.getItem("currentConversationId");
    const savedRoomId = localStorage.getItem("currentRoomId");
    
    if (savedConversationId) {
      // Load the saved conversation
      fetch(`/api/conversations/${savedConversationId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(conv => {
          if (conv && conv.userId === user._id) {
            loadConversation(conv);
            if (savedRoomId) {
              setCurrentRoomId(savedRoomId);
            }
          }
        })
        .catch(() => {
          // If loading fails, clear the saved IDs
          localStorage.removeItem("currentConversationId");
          localStorage.removeItem("currentRoomId");
        });
    }
  } else {

    setConversationId(null);
    setMessages([]);
    setCurrentRoomId(null);
    localStorage.removeItem("currentConversationId");
    localStorage.removeItem("currentRoomId");
  }

}, [user]);

  function handleUpload(file) {
    if (loading) return;
    setSelectedFile(file);
    console.log('[File Selection] File selected:', file.name, 'size:', file.size);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text && !selectedFile) return;
    if (loading) return;

    setLoading(true);
    setInput("");
  
    let convId = conversationId;
    // Only create conversation for authenticated users
    if (!convId && !isGuestMode) {
      const title = generateConversationTitle(text);
      const res = await fetch("/api/conversations", { 
        method: "POST", 
        credentials: 'include', 
        headers: getHeaders(),
        body: JSON.stringify({ title })
      });
      const conv = await res.json();
      convId = conv._id;
      setConversationId(convId);
      // Save new conversation ID to localStorage
      localStorage.setItem("currentConversationId", convId);
      localStorage.removeItem("currentRoomId"); // New conversation has no room
    }

    let uploadedFileData = null;

    // Handle file upload if file is selected (do this first)
    if (selectedFile && !isGuestMode && convId) {
      try {
        const form = new FormData();
        form.append("file", selectedFile);
        form.append("conversationId", convId);
        form.append("messageText", text || "");

        const res = await fetch("/api/upload-file", {
          method: "POST",
          credentials: 'include',
          body: form,
        });

        const data = await res.json();

        if (res.ok) {
          uploadedFileData = data.file;
        } else {
          const errorMsg = data?.message || data?.error || "Upload failed";
          const botMsg = { 
            id: uid(), 
            role: "assistant", 
            content: `⚠️ ${errorMsg}` 
          };
          setMessages((prev) => [...prev, botMsg]);
          await saveMessageWithId(convId, "assistant", botMsg.content);
          setLoading(false);
          setSelectedFile(null);
          return;
        }
      } catch (error) {
        console.error('[File Upload] Error:', error);
        const botMsg = {
          id: uid(),
          role: "assistant",
          content: "⚠️ File upload failed (Network Error).",
        };
        setMessages((prev) => [...prev, botMsg]);
        await saveMessageWithId(convId, "assistant", botMsg.content);
        setLoading(false);
        setSelectedFile(null);
        return;
      }
    }

    // Add user message to chat if there's text
    if (text) {
      const userMsg = { id: uid(), role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      
      // Track guest messages
      if (isGuestMode) {
        const newCount = guestMessageCount + 1;
        setGuestMessageCount(newCount);
        
        // Show signup CTA after 3-5 messages (randomly between 3-5)
        if (newCount >= 3 && newCount <= 5 && !showSignupCTA) {
          const showAt = 3 + Math.floor(Math.random() * 3); // Random between 3-5
          if (newCount === showAt) {
            setShowSignupCTA(true);
          }
        }
      }
    }

    // Add upload message to chat if file was uploaded
    if (uploadedFileData) {
      const uploadMsg = { 
        id: uid(), 
        role: "user", 
        content: `📎 Document uploaded: ${selectedFile.name}`,
        documentId: uploadedFileData.id,
        filename: selectedFile.name
      };
      setMessages((prev) => [...prev, uploadMsg]);
      await saveMessageWithId(convId, "user", uploadMsg.content, uploadedFileData.id, selectedFile.name);
    }
  
    try {
      // Build messages array including the upload message if file was uploaded
      const messagesForLLM = [...messages];
      if (text) {
        messagesForLLM.push({ id: uid(), role: "user", content: text });
      }
      if (uploadedFileData) {
        messagesForLLM.push({
          id: uid(),
          role: "user", 
          content: `📎 Document uploaded: ${selectedFile.name}`,
          documentId: uploadedFileData.id,
          filename: selectedFile.name
        });
      }
      
      const res = await fetch("/api/answer", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesForLLM,
          roomId: currentRoomId,
        }),
      });

      const data = await res.json();
      
      // Handle rate limit for guests
      if (res.status === 429 && data.limitReached) {
        const botMsg = { 
          id: uid(), 
          role: "assistant", 
          content: "⚠️ You've reached the guest message limit (10 messages). Please sign up to continue chatting with unlimited messages!" 
        };
        setMessages((prev) => [...prev, botMsg]);
        setShowSignupCTA(true);
        setLoading(false);
        return;
      }
      
      const botText = data?.text || t('app.noResponse');

      setTopic(data?.topic || "Other");

      const botMsg = { id: uid(), role: "assistant", content: botText };
      setMessages((prev) => [...prev, botMsg]);
      
      // Save both messages to the database (only for authenticated users)
      if (!isGuestMode && convId) {
        if (text) {
          await saveMessageWithId(convId, "user", text);
        }
        await saveMessageWithId(convId, "assistant", botText);
      }
    } catch (_e) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: t('app.networkError'),
        },
      ]);
      if (!isGuestMode && convId) {
        await saveMessageWithId(convId, "assistant", t('app.networkError'));
      }
    } finally {
      setLoading(false);
      setSelectedFile(null); // Clear selected file after sending
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

  // Show login/signup if not authenticated and not in guest mode
  if (!user && !isGuestMode) {
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

  const handleSignupFromCTA = () => {
    setShowSignupCTA(false);
    exitGuestMode();
    setShowLogin(false); // Show signup form
  };

  const handleDismissCTA = () => {
    setShowSignupCTA(false);
  };

  const handleLoginFromSidebar = () => {
    setSidebarOpen(false);
    setShowLogin(true);
  };

  const handleSignupFromSidebar = () => {
    setSidebarOpen(false);
    setShowLogin(false);
  };

  return (
    <div className="app-root">
      {isGuestMode && <GuestModeIndicator />}
      
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSettings={() => {
          setShowConversations(false);
          setShowRooms(false);
          setShowProfile(false);
          setShowSettings(true);
        }}
        onConversations={() => {
          setShowSettings(false);
          setShowRooms(false);
          setShowProfile(false);
          setShowConversations(true);
        }}
        onRooms={() => {
          setShowSettings(false);
          setShowConversations(false);
          setShowProfile(false);
          setShowRooms(true);
        }}
        onNewChat={newChat}
        onProfile={() => {
          setShowSettings(false);
          setShowConversations(false);
          setShowRooms(false);
          setShowProfile(true);
        }}
        onLogin={handleLoginFromSidebar}
        onSignup={handleSignupFromSidebar}
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
            selectedFile={selectedFile}
            onClearFile={() => setSelectedFile(null)}
          />
        </div>
      </main>

      {showSettings && (
        <>
          <div className="overlay" onClick={() => setShowSettings(false)} />
          <SettingsModal
            theme={theme}
            setTheme={handleThemeChange}
            onLanguageChange={handleLanguageChange}
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

      {showRooms && (
        <>
          <div className="overlay" onClick={() => setShowRooms(false)} />
          <RoomsModal
            onClose={() => setShowRooms(false)}
            onLoadConversation={loadConversation}
            currentConversationId={conversationId}
          />
        </>
      )}

      {showProfile && (
        <>
          <div className="overlay" onClick={() => setShowProfile(false)} />
          <ProfileModal onClose={() => setShowProfile(false)} />
        </>
      )}

      {showDisclaimer && (
        <OpenAIDisclaimer 
          onAccept={handleDisclaimerAccept}
          onDecline={handleDisclaimerDecline}
        />
      )}

      {showSignupCTA && (
        <SignupCTA 
          onSignup={handleSignupFromCTA}
          onDismiss={handleDismissCTA}
        />
      )}
    </div>
  );
}
