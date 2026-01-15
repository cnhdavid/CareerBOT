/**
 * Generate a conversation title from the first user message
 * Takes the first 50 characters of the message, removes extra whitespace,
 * and adds ellipsis if truncated
 */
export function generateConversationTitle(firstMessage) {
  if (!firstMessage || typeof firstMessage !== 'string') {
    return 'New Conversation';
  }

  // Remove extra whitespace and newlines
  const cleaned = firstMessage.trim().replace(/\s+/g, ' ');
  
  // Take first 50 characters
  if (cleaned.length > 50) {
    return cleaned.substring(0, 50) + '...';
  }
  
  return cleaned || 'New Conversation';
}
