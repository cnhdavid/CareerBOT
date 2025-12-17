import { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send, Loader2 } from "lucide-react";
import "./Chat.css";

export default function Chat({ messages, input, setInput, loading, onSend }) {
  const endRef = useRef(null);
  const scrollRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (isAtBottom) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isAtBottom]);

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 30;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsAtBottom(atBottom);
  }

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  return (
    <div className="chatShell">
      {/* Verlauf */}
      <div className="chatViewport" ref={scrollRef} onScroll={onScroll}>
        <div className="chatInner">
          {messages.map((m) => (
            <Message key={m.id} role={m.role} text={m.content} />
          ))}

          {loading && (
            <Message
              role="assistant"
              text="Schreibe…"
              isTyping
            />
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="composerBar">
        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Schreibe eine Nachricht…"
            rows={1}
            disabled={loading}
          />

          <button className="iconBtn" type="button" aria-label="Anhang">
            <Paperclip size={18} />
          </button>

          <button
            className="sendBtn"
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-label="Senden"
          >
            {loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
          </button>
        </div>

        <div className="composerHint">
          Enter zum Senden · Shift+Enter für neue Zeile
        </div>
      </div>
    </div>
  );
}

function Message({ role, text, isTyping }) {
  const isUser = role === "user";
  return (
    <div className={`msgRow ${isUser ? "user" : "assistant"}`}>
      <div className={`msgBubble ${isUser ? "user" : "assistant"}`}>
        {!isTyping ? (
          <span>{text}</span>
        ) : (
          <span className="typing">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </span>
        )}
      </div>
    </div>
  );
}
