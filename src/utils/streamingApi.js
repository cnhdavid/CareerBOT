export async function streamChatCompletion(messages, roomId, onChunk, onComplete, onError) {
  try {
    const response = await fetch('/api/answer', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        roomId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Request failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let topic = 'Other';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.done) {
              fullText = parsed.fullText || fullText;
              topic = parsed.topic || topic;
              if (onComplete) {
                onComplete(fullText, topic);
              }
            } else if (parsed.content) {
              fullText += parsed.content;
              topic = parsed.topic || topic;
              if (onChunk) {
                onChunk(parsed.content, fullText, topic);
              }
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }

    return { text: fullText, topic };
  } catch (error) {
    console.error('Streaming error:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

export async function fallbackChatCompletion(messages, roomId) {
  const response = await fetch('/api/answer', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      roomId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Request failed');
  }

  return await response.json();
}
