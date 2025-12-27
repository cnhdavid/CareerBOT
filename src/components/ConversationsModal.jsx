import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function ConversationsModal({ onClose, onLoadConversation }) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  useEffect(() => {
    fetch("/api/conversations", { headers: getHeaders() })
      .then(res => res.json())
      .then(data => {
        setConversations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLoad = (conv) => {
    onLoadConversation(conv);
    onClose();
  };

  const handleRename = async (id, newName) => {
    try {
      const response = await fetch(`/api/conversations/${id}/name`, {
        method: "PATCH",
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
        headers: getHeaders(),
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
    <div className="settings-modal">
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
                  />
                ) : (
                  <div className="conversation-name">
                    {conv.name || (conv.messages.length > 0 ? conv.messages[0].content.substring(0, 50) + '...' : 'Empty conversation')}
                  </div>
                )}
                <div className="conversation-date">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="conversation-actions">
                <button onClick={() => startEditing(conv)} title="Rename">
                  ✏️
                </button>
                <button onClick={() => handleDelete(conv._id)} title="Delete">
                  🗑️
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