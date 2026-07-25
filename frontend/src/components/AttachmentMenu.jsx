import { useEffect, useRef } from "react";

const OPTIONS = [
  { key: "image", label: "Photo or GIF", icon: "🖼️", accept: "image/*,.gif" },
  { key: "video", label: "Video", icon: "🎬", accept: "video/*" },
  { key: "audio", label: "Audio", icon: "🎵", accept: "audio/*" },
  { key: "file", label: "Document", icon: "📎", accept: "*" },
];

export default function AttachmentMenu({ onPick, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div className="attach-menu" ref={ref}>
      {OPTIONS.map((opt) => (
        <label key={opt.key} className="attach-option">
          <span className="attach-icon">{opt.icon}</span>
          <span>{opt.label}</span>
          <input
            type="file"
            accept={opt.accept}
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPick(file);
              e.target.value = "";
            }}
          />
        </label>
      ))}
    </div>
  );
}
