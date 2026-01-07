import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Edit3, Trash2, X, MessageSquare, Calendar } from "lucide-react";

export default function ConversationsModal({ onClose, onLoadConversation }) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const getHeaders = () => ({
    "Content-Type": "application/json",
  });

  useEffect(() => {
    fetch("/api/conversations", { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setConversations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load conversations:", error);
        setConversations([]);
        setLoading(false);
      });
  }, []);

  const handleLoad = (conv) => {
    onLoadConversation(conv);
    onClose();
  };

  const handleRename = async (id, newName) => {
    try {
      const response = await fetch(`/api/conversations/${id}/name`, {
        method: "PATCH",
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify({ name: newName }),
      });
      if (response.ok) {
        setConversations(conversations.map(conv =>
          conv._id === id ? { ...conv, name: newName } : conv
        ));
        setEditingId(null);
      } else {
        alert("Failed to rename conversation");
      }
    } catch (error) {
      console.error("Rename error:", error);
      alert("Error renaming conversation");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('conversations.confirmDelete', { defaultValue: 'Are you sure you want to delete this conversation?' }))) {
      return;
    }
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (response.ok) {
        setConversations(conversations.filter(conv => conv._id !== id));
      } else {
        alert("Failed to delete conversation");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting conversation");
    }
  };

  const startEditing = (conv) => {
    setEditingId(conv._id);
    setEditName(conv.name || "");
  };

  const saveEdit = () => {
    if (editingId) {
      handleRename(editingId, editName);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  return (
    <div className="conversations-modal">
      <h2>{t('conversations.title', { defaultValue: 'Old Conversations' })}</h2>

      {loading ? (
        <p>{t('app.loading', { defaultValue: 'Loading...' })}</p>
      ) : conversations.length === 0 ? (
        <p>{t('conversations.noConversations', { defaultValue: 'No conversations found.' })}</p>
      ) : (
        <div className="conversations-list">
          {conversations.map(conv => (
            <div key={conv._id} className="conversation-item">
              <div className="conversation-content" onClick={() => handleLoad(conv)}>
                <div className="conversation-header">
                  <MessageSquare size={16} className="conversation-icon" />
                  {editingId === conv._id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                      className="conversation-name-input"
                    />
                  ) : (
                    <div className="conversation-name">
                      {conv.name || (conv.messages.length > 0 ? conv.messages[0].content.substring(0, 50) + '...' : 'Empty conversation')}
                    </div>
                  )}
                </div>
                <div className="conversation-meta">
                  <Calendar size={12} className="date-icon" />
                  <span className="conversation-date">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="conversation-actions">
                <button 
                  className="icon-btn"
                  onClick={() => startEditing(conv)} 
                  title="Rename"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  className="icon-btn danger"
                  onClick={() => handleDelete(conv._id)} 
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="close-btn" onClick={onClose}>
        {t('settings.close', { defaultValue: 'Close' })}
      </button>
    </div>
  );
}