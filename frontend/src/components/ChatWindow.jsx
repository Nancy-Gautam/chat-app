import { useEffect, useRef } from "react";
import Avatar from "./Avatar.jsx";
import MessageInput from "./MessageInput.jsx";
import MessageBubble from "./MessageBubble.jsx";

function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

export default function ChatWindow({
  selectedUser,
  messages,
  myId,
  onSend,
  onSendFile,
  uploading,
  onTyping,
  isTyping,
  online,
  onBack,
  onStartCall,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (!selectedUser) {
    return (
      <section className="chat-window chat-window-empty">
        <div className="empty-state">
          <div className="empty-state-mark">✎</div>
          <h2>Pick a conversation</h2>
          <p>Choose someone from the list to start chatting in real time.</p>
        </div>
      </section>
    );
  }

  let lastDay = null;

  return (
    <section className="chat-window">
      <header className="chat-window-header">
        <button className="back-btn" onClick={onBack} aria-label="Back to conversations">
          ←
        </button>
        <Avatar
          name={selectedUser.name}
          color={selectedUser.avatarColor}
          avatarUrl={selectedUser.avatarUrl}
          online={online}
        />
        <div className="chat-window-header-info">
          <span className="chat-window-name">{selectedUser.name}</span>
          <span className="chat-window-status">
            {isTyping ? "Typing…" : online ? "Online" : "Offline"}
          </span>
        </div>

        <div className="chat-window-header-actions">
          <button
            className="icon-btn"
            onClick={() => onStartCall(selectedUser, "audio")}
            aria-label="Voice call"
            title="Voice call"
          >
            📞
          </button>
          <button
            className="icon-btn"
            onClick={() => onStartCall(selectedUser, "video")}
            aria-label="Video call"
            title="Video call"
          >
            🎥
          </button>
        </div>
      </header>

      <div className="chat-window-body">
        {messages.length === 0 && (
          <p className="chat-window-hint">
            This is the start of your conversation with {selectedUser.name}. Say hello 👋
          </p>
        )}

        {messages.map((m) => {
          const dayLabel = formatDayLabel(m.createdAt);
          const showDay = dayLabel !== lastDay;
          lastDay = dayLabel;
          const mine = m.sender === myId || m.sender?._id === myId;

          return (
            <div key={m._id || m.tempId}>
              {showDay && <div className="day-divider"><span>{dayLabel}</span></div>}
              <div className={`bubble-row ${mine ? "mine" : "theirs"}`}>
                <MessageBubble message={m} mine={mine} />
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="bubble-row theirs">
            <div className="bubble bubble-theirs typing-bubble">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={onSend} onSendFile={onSendFile} uploading={uploading} onTyping={onTyping} />
    </section>
  );
}
