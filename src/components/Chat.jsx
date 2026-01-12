import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Paperclip, Send, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ResourcesPanel from "./ResourcesPanel";
import "./Chat.css";

export default function Chat({ messages, input, setInput, loading, onSend, topic, onUpload, selectedFile, onClearFile }) {
  const { t } = useTranslation();
  const endRef = useRef(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
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

  const canSend = useMemo(() => (input.trim().length > 0 || selectedFile) && !loading, [input, selectedFile, loading]);

  return (
    <div className="chatShell">
      {/* Verlauf */}
      <div className="chatViewport" ref={scrollRef} onScroll={onScroll}>
        <div className="chatInner">
          {messages.length === 0 && !loading && (
            <div className="chatPlaceholder">
              <span>{t('app.howCanIHelp')}</span>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} role={m.role} text={m.content} />
          ))}

          {loading && (
            <Message
              role="assistant"
              text={t('chat.typing')}
              isTyping
            />
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* Selected File Display */}
      {selectedFile && (
        <div className="selected-file-display" style={{
          padding: '8px 16px',
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Paperclip size={16} />
            <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button
            className="iconBtn"
            type="button"
            onClick={onClearFile}
            aria-label="Clear file"
            style={{ padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <ResourcesPanel topic={topic} />

      {/* Composer */}
      <div className="composerBar">

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          accept=".pdf,.docx,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload?.(file);
            e.target.value = ""; // reset so same file can be re-selected
          }}
        />

        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('chat.messagePlaceholder')}
            rows={1}
            disabled={loading}
          />

          <button
            className="iconBtn"
            type="button"
            aria-label={t("chat.attachment")}
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={18} />
          </button>

          <button
            className="sendBtn"
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-label={t('chat.send')}
          >
            {loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
          </button>
        </div>

        <div className="composerHint">
          {t('chat.hint')}
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
          isUser ? (
            <span>{text}</span>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          )
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
