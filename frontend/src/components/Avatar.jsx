import { API_URL } from "../api/axios.js";

export default function Avatar({ name, color, avatarUrl, size = 40, online }) {
  const initial = name ? name.trim().charAt(0).toUpperCase() : "?";
  const src = avatarUrl ? `${API_URL}${avatarUrl}` : null;

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: src ? "transparent" : color || "#5B4EFF",
        fontSize: size * 0.4,
      }}
    >
      {src ? (
        <img className="avatar-img" src={src} alt={name} />
      ) : (
        initial
      )}
      {online !== undefined && (
        <span className={`avatar-dot ${online ? "is-online" : ""}`} />
      )}
    </div>
  );
}
