import { useEffect, useRef } from "react";

// A compact, hand-picked emoji set grouped by category — no external
// package needed, keeps the app lightweight and fast to install.
const EMOJI_GROUPS = {
  Smileys: ["😀","😁","😂","🤣","😊","😍","😘","😜","🤔","🙄","😴","🤗","😎","🥳","😢","😭","😡","😱","🥺","😇"],
  Gestures: ["👍","👎","👏","🙌","🙏","🤝","💪","✌️","🤞","👋","🤙","👌","🫶","💯"],
  Hearts: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💕","💖","💔"],
  Objects: ["🔥","✨","🎉","🎂","🎁","☕","🍕","🍔","🍿","⚽","🎮","📸","🌙","☀️","🌈","⭐"],
};

export default function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div className="emoji-picker" ref={ref}>
      {Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
        <div key={group} className="emoji-group">
          <span className="emoji-group-label">{group}</span>
          <div className="emoji-grid">
            {emojis.map((e) => (
              <button
                key={e}
                type="button"
                className="emoji-btn"
                onClick={() => onSelect(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
