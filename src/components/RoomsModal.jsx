import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Folder, MessageSquare, X, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export default function RoomsModal({ onClose, onLoadConversation, currentConversationId }) {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [allConversations, setAllConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [expandedRooms, setExpandedRooms] = useState(new Set());
  const [showAllConversations, setShowAllConversations] = useState(false);

  const getHeaders = () => ({
    "Content-Type": "application/json",
  });

  useEffect(() => {
    fetchRooms();
    fetchAllConversations();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms", { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setRooms(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
      setLoading(false);
    }
  };

  const fetchAllConversations = async () => {
    try {
      const response = await fetch("/api/conversations", { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setAllConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setAllConversations([]);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify({ name: newRoomName.trim() }),
      });

      if (response.ok) {
        const newRoom = await response.json();
        setRooms([...rooms, newRoom]);
        setNewRoomName("");
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Error creating room");
    }
  };

  const updateRoomName = async (roomId, newName) => {
    if (!newName.trim()) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/name`, {
        method: "PATCH",
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (response.ok) {
        setRooms(rooms.map(room =>
          room._id === roomId ? { ...room, name: newName.trim() } : room
        ));
        setEditingRoomId(null);
        setEditRoomName("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update room");
      }
    } catch (error) {
      console.error("Error updating room:", error);
      alert("Error updating room");
    }
  };

  const deleteRoom = async (roomId) => {
    if (!confirm("Are you sure you want to delete this room? Conversations will not be deleted.")) {
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (response.ok) {
        setRooms(rooms.filter(room => room._id !== roomId));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Error deleting room");
    }
  };

  const addConversationToRoom = async (roomId, conversationId) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/conversations`, {
        method: "POST",
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify({ conversationId }),
      });

      if (response.ok) {
        const updatedRoom = await response.json();
        setRooms(rooms.map(room =>
          room._id === roomId ? updatedRoom : room
        ));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add conversation to room");
      }
    } catch (error) {
      console.error("Error adding conversation to room:", error);
      alert("Error adding conversation to room");
    }
  };

  const removeConversationFromRoom = async (roomId, conversationId) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/conversations/${conversationId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (response.ok) {
        const updatedRoom = await response.json();
        setRooms(rooms.map(room =>
          room._id === roomId ? updatedRoom : room
        ));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to remove conversation from room");
      }
    } catch (error) {
      console.error("Error removing conversation from room:", error);
      alert("Error removing conversation from room");
    }
  };

  const startEditing = (room) => {
    setEditingRoomId(room._id);
    setEditRoomName(room.name);
  };

  const saveEdit = (roomId) => {
    updateRoomName(roomId, editRoomName);
  };

  const cancelEdit = () => {
    setEditingRoomId(null);
    setEditRoomName("");
  };

  const toggleRoomExpanded = (roomId) => {
    const newExpanded = new Set(expandedRooms);
    if (newExpanded.has(roomId)) {
      newExpanded.delete(roomId);
    } else {
      newExpanded.add(roomId);
    }
    setExpandedRooms(newExpanded);
  };

  const getAvailableConversationsForRoom = (room) => {
    const roomConversationIds = room.conversationIds?.map(conv => conv._id) || [];
    return allConversations.filter(conv => 
      !roomConversationIds.includes(conv._id) && 
      (conv.name || (conv.messages && conv.messages.length > 0))
    );
  };

  const getCurrentConversation = () => {
    return allConversations.find(conv => conv._id === currentConversationId);
  };

  const canAddCurrentConversation = (room) => {
    const currentConv = getCurrentConversation();
    return currentConversationId && 
           currentConv && 
           (currentConv.name || (currentConv.messages && currentConv.messages.length > 0)) &&
           !room.conversationIds?.some(conv => conv._id === currentConversationId) && 
           room.conversationIds?.length < 5;
  };

  return (
    <div className="rooms-modal">
      <div className="modal-header">
        <h2>{t('rooms.title', { defaultValue: 'Rooms' })}</h2>
        <button className="icon-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="modal-content">
        {loading ? (
          <p>{t('app.loading', { defaultValue: 'Loading...' })}</p>
        ) : (
          <>
            <div className="rooms-actions">
              <button 
                className="btn-primary"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <Plus size={16} />
                {t('rooms.createRoom', { defaultValue: 'Create Room' })}
              </button>
            </div>

            {showCreateForm && (
              <div className="create-room-form">
                <input
                  type="text"
                  placeholder={t('rooms.roomNamePlaceholder', { defaultValue: 'Enter room name...' })}
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createRoom();
                    if (e.key === 'Escape') {
                      setShowCreateForm(false);
                      setNewRoomName("");
                    }
                  }}
                  autoFocus
                />
                <div className="form-actions">
                  <button className="btn-primary" onClick={createRoom}>
                    {t('common.create', { defaultValue: 'Create' })}
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewRoomName("");
                    }}
                  >
                    {t('common.cancel', { defaultValue: 'Cancel' })}
                  </button>
                </div>
              </div>
            )}

            <div className="rooms-list">
              {rooms.length === 0 ? (
                <p>{t('rooms.noRooms', { defaultValue: 'No rooms found. Create your first room!' })}</p>
              ) : (
                rooms.map(room => (
                  <div key={room._id} className="room-item">
                    <div className="room-header">
                      <div className="room-info">
                        <Folder size={18} className="room-icon" />
                        {editingRoomId === room._id ? (
                          <input
                            type="text"
                            value={editRoomName}
                            onChange={(e) => setEditRoomName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(room._id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                          />
                        ) : (
                          <h3 className="room-name">{room.name}</h3>
                        )}
                      </div>
                      <div className="room-actions">
                        {editingRoomId === room._id ? (
                          <>
                            <button 
                              className="icon-btn success"
                              onClick={() => saveEdit(room._id)}
                              title="Save"
                            >
                              ✓
                            </button>
                            <button 
                              className="icon-btn"
                              onClick={cancelEdit}
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="icon-btn"
                              onClick={() => startEditing(room)}
                              title="Rename"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="icon-btn danger"
                              onClick={() => deleteRoom(room._id)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="room-conversations">
                      <div className="conversations-header">
                        <div className="conversation-info">
                          <span className="conversation-count">
                            {room.conversationIds?.length || 0}/5 {t('rooms.conversations', { defaultValue: 'conversations' })}
                          </span>
                          <button 
                            className="icon-btn small"
                            onClick={() => toggleRoomExpanded(room._id)}
                            title={expandedRooms.has(room._id) ? "Show less" : "Show more"}
                          >
                            {expandedRooms.has(room._id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                        {canAddCurrentConversation(room) && (
                          <button 
                            className="btn-small"
                            onClick={() => addConversationToRoom(room._id, currentConversationId)}
                          >
                            <Plus size={12} />
                            {t('rooms.addCurrentConversation', { defaultValue: 'Add current conversation' })}
                          </button>
                        )}
                      </div>
                      
                      {room.conversationIds && room.conversationIds.length > 0 ? (
                        <div className="conversation-list">
                          {room.conversationIds.map(conv => (
                            <div key={conv._id} className="conversation-in-room">
                              <div className="conversation-info">
                                <MessageSquare size={14} />
                                <span 
                                  className="conversation-name"
                                  onClick={() => {
                                    onLoadConversation(conv);
                                    onClose();
                                  }}
                                >
                                  {conv.name || (conv.messages?.length > 0 ? conv.messages[0].content.substring(0, 50) + '...' : 'Empty conversation')}
                                </span>
                              </div>
                              <button 
                                className="icon-btn small danger"
                                onClick={() => removeConversationFromRoom(room._id, conv._id)}
                                title="Remove from room"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-room">
                          {t('rooms.emptyRoom', { defaultValue: 'No conversations in this room yet.' })}
                        </p>
                      )}

                      {expandedRooms.has(room._id) && (
                        <div className="add-conversations-section">
                          <div className="add-conversations-header">
                            <span className="add-conversations-title">
                              {t('rooms.addExistingConversations', { defaultValue: 'Add existing conversations' })}
                            </span>
                          </div>
                          {getAvailableConversationsForRoom(room).length > 0 ? (
                            <div className="available-conversations">
                              {getAvailableConversationsForRoom(room).map(conv => (
                                <div key={conv._id} className="available-conversation">
                                  <div className="conversation-info">
                                    <MessageSquare size={14} />
                                    <span className="conversation-name">
                                      {conv.name || (conv.messages?.length > 0 ? conv.messages[0].content.substring(0, 60) + '...' : 'Empty conversation')}
                                    </span>
                                  </div>
                                  <button 
                                    className="btn-small"
                                    onClick={() => addConversationToRoom(room._id, conv._id)}
                                    disabled={room.conversationIds?.length >= 5}
                                  >
                                    <Plus size={12} />
                                    {t('rooms.add', { defaultValue: 'Add' })}
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="no-available-conversations">
                              {t('rooms.noAvailableConversations', { defaultValue: 'All conversations are already in this room' })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
