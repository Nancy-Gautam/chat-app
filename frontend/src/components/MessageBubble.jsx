import { API_URL } from "../api/axios.js";

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatBytes(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function MessageBubble({ message, mine }) {
  const url = message.fileUrl ? `${API_URL}${message.fileUrl}` : null;

  let content;
  switch (message.type) {
    case "image":
    case "gif":
      content = (
        <a href={url} target="_blank" rel="noopener noreferrer" className="media-link">
          <img src={url} alt={message.fileName || "photo"} className="bubble-media-img" />
        </a>
      );
      break;
    case "video":
      content = (
        <video src={url} controls className="bubble-media-video" preload="metadata" />
      );
      break;
    case "audio":
      content = <audio src={url} controls className="bubble-media-audio" />;
      break;
    case "file":
      content = (
        <a href={url} target="_blank" rel="noopener noreferrer" className="bubble-file">
          <span className="bubble-file-icon">📄</span>
          <span className="bubble-file-info">
            <span className="bubble-file-name">{message.fileName}</span>
            <span className="bubble-file-size">{formatBytes(message.fileSize)}</span>
          </span>
        </a>
      );
      break;
    default:
      content = <p>{message.text}</p>;
  }

  return (
    <div className={`bubble ${mine ? "bubble-mine" : "bubble-theirs"} ${message.type !== "text" ? "bubble-media" : ""}`}>
      {content}
      <span className="bubble-time">{formatTime(message.createdAt)}</span>
    </div>
  );
}
