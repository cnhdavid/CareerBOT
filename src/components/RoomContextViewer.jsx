import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Folder, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getRoomContext, formatRoomContext, getConversationSummaries } from '../utils/roomContext';

export default function RoomContextViewer({ roomId, currentConversationId, token }) {
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const fetchRoomContext = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRoomContext(roomId, token);
      setRoomData(data);
    } catch (error) {
      console.error('Failed to load room context:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId, token]);

  useEffect(() => {
    if (roomId && token) {
      fetchRoomContext();
    }
  }, [roomId, token, fetchRoomContext]);


  if (loading) {
    return <div className="loading-context">Loading room context...</div>;
  }

  if (!roomData) {
    return (
      <div className="room-context-viewer">
        <button 
          className="btn-small"
          onClick={fetchRoomContext}
        >
          <MessageSquare size={14} />
          Load Room Context
        </button>
      </div>
    );
  }

  const conversationSummaries = getConversationSummaries(roomData);
  const formattedContext = formatRoomContext(roomData);

  return (
    <div className="room-context-viewer">
      <div className="context-header">
        <div className="context-info">
          <Folder size={16} />
          <span className="room-name">{roomData.roomInfo?.name || 'Unnamed Room'}</span>
          <span className="context-stats">
            {roomData.roomInfo?.totalConversations || 0} conversations, 
            {roomData.roomInfo?.totalMessages || 0} messages
          </span>
        </div>
        <button 
          className="icon-btn small"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="context-content">
          <div className="context-actions">
            <button 
              className="btn-small"
              onClick={fetchRoomContext}
            >
              <MessageSquare size={12} />
              All Conversations
            </button>
          </div>

          {conversationSummaries.length > 0 && (
            <div className="conversation-summaries">
              <h4>Conversations in this room:</h4>
              {conversationSummaries.map(conv => (
                <div 
                  key={conv.id} 
                  className={`conversation-summary ${selectedConversation === conv.id ? 'selected' : ''}`}
                  onClick={() => setSelectedConversation(conv.id === selectedConversation ? null : conv.id)}
                >
                  <div className="conv-info">
                    <span className="conv-name">{conv.name}</span>
                    <span className="conv-stats">{conv.messageCount} messages</span>
                  </div>
                  <div className="conv-meta">
                    <Clock size={12} />
                    <span className="conv-date">
                      {new Date(conv.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {formattedContext && (
            <div className="formatted-context">
              <h4>Room Context:</h4>
              <pre className="context-text">{formattedContext}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
