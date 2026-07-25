import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar.jsx";
import { API_URL } from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const DURATION = 5000; // ms per story

export default function StoryViewer({ group, startIndex, onClose, onView, onDelete }) {
  const { user } = useAuth();
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const startRef = useRef(null);

  const story = group.stories[index];
  const isMine = story?.user._id === user._id;

  const goNext = () => {
    if (index < group.stories.length - 1) setIndex((i) => i + 1);
    else onClose();
  };

  const goPrev = () => {
    if (index > 0) setIndex((i) => i - 1);
  };

  useEffect(() => {
    if (!story) return;
    onView?.(story);
    setProgress(0);
    startRef.current = Date.now();

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        goNext();
      }
    }, 50);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, group]);

  if (!story) return null;

  return (
    <div className="story-overlay">
      <div className="story-viewer">
        <div className="story-progress-row">
          {group.stories.map((s, i) => (
            <div key={s._id} className="story-progress-track">
              <div
                className="story-progress-fill"
                style={{
                  width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        <div className="story-header">
          <Avatar
            name={group.user.name}
            color={group.user.avatarColor}
            avatarUrl={group.user.avatarUrl}
            size={34}
          />
          <span className="story-header-name">{group.user.name}</span>
          <span className="story-header-time">
            {new Date(story.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button className="story-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div
          className="story-content"
          style={{ background: story.type === "text" ? story.backgroundColor : "#000" }}
        >
          <div className="story-tap-zone story-tap-left" onClick={goPrev} />
          <div className="story-tap-zone story-tap-right" onClick={goNext} />

          {story.type === "image" && (
            <img src={`${API_URL}${story.mediaUrl}`} alt="" className="story-media" />
          )}
          {story.type === "video" && (
            <video src={`${API_URL}${story.mediaUrl}`} className="story-media" autoPlay muted playsInline />
          )}
          {story.type === "text" && <p className="story-text">{story.caption}</p>}

          {story.type !== "text" && story.caption && (
            <p className="story-caption">{story.caption}</p>
          )}
        </div>

        {isMine && (
          <button className="story-delete-btn" onClick={() => onDelete(story)}>
            🗑️ Delete story
          </button>
        )}
      </div>
    </div>
  );
}
