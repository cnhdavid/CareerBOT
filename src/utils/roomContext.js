// Utility functions for accessing room context

export const getRoomContext = async (roomId) => {
  try {
    const response = await fetch(`/api/rooms/${roomId}/context`, {
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch room context');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching room context:', error);
    return null;
  }
};


// Format room context for display
export const formatRoomContext = (roomData) => {
  if (!roomData || !roomData.messages || roomData.messages.length === 0) {
    return 'No context available from other conversations in this room.';
  }

  let context = `=== Context from "${roomData.roomInfo?.name || 'Room'}" ===\n`;
  context += `This room contains ${roomData.roomInfo?.totalConversations || 0} conversations with ${roomData.roomInfo?.totalMessages || 0} total messages.\n\n`;

  // Group messages by conversation
  const messagesByConversation = {};
  roomData.messages.forEach(msg => {
    const convName = msg.conversationName || 'Unnamed Conversation';
    if (!messagesByConversation[convName]) {
      messagesByConversation[convName] = [];
    }
    messagesByConversation[convName].push(msg);
  });

  // Add formatted messages
  Object.entries(messagesByConversation).forEach(([convName, msgs]) => {
    context += `--- ${convName} ---\n`;
    msgs.forEach(msg => {
      context += `[${msg.role.toUpperCase()}]: ${msg.content}\n`;
    });
    context += '\n';
  });

  context += '=== End of Room Context ===\n';
  return context;
};

// Get specific conversation from room context
export const getConversationFromContext = (roomData, conversationId) => {
  if (!roomData || !roomData.messages) return null;
  
  return roomData.messages.filter(msg => msg.conversationId === conversationId);
};

// Get all conversation summaries from room
export const getConversationSummaries = (roomData) => {
  if (!roomData || !roomData.conversations) return [];
  
  return roomData.conversations.map(conv => ({
    id: conv.id,
    name: conv.name,
    messageCount: conv.messageCount,
    lastUpdated: conv.lastUpdated
  }));
};
