import { useRef, useState } from "react";
import EmojiPicker from "./EmojiPicker.jsx";
import AttachmentMenu from "./AttachmentMenu.jsx";

export default function MessageInput({ onSend, onTyping, onSendFile, uploading }) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const typingTimeout = useRef(null);
  const inputRef = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping?.(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping?.(false), 1200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    onTyping?.(false);
  };

  const handleEmojiSelect = (emoji) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleFilePick = (file) => {
    setShowAttach(false);
    onSendFile(file);
  };

  return (
    <div className="message-input-wrap">
      {showEmoji && (
        <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
      )}
      {showAttach && (
        <AttachmentMenu onPick={handleFilePick} onClose={() => setShowAttach(false)} />
      )}

      <form className="message-input" onSubmit={handleSubmit}>
        <button
          type="button"
          className="icon-btn"
          onClick={() => {
            setShowAttach((v) => !v);
            setShowEmoji(false);
          }}
          aria-label="Attach file"
          title="Attach photo, video, audio or file"
        >
          📎
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={() => {
            setShowEmoji((v) => !v);
            setShowAttach(false);
          }}
          aria-label="Insert emoji"
          title="Emoji"
        >
          😊
        </button>

        <input
          ref={inputRef}
          type="text"
          placeholder={uploading ? "Uploading…" : "Write a message…"}
          value={text}
          onChange={handleChange}
          autoComplete="off"
          disabled={uploading}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={!text.trim() || uploading}
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
