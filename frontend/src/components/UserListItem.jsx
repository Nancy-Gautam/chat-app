import Avatar from "./Avatar.jsx";

export default function UserListItem({ user, active, online, unread, onClick }) {
  return (
    <button
      className={`user-item ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      <Avatar name={user.name} color={user.avatarColor} avatarUrl={user.avatarUrl} online={online} />
      <div className="user-item-info">
        <div className="user-item-top">
          <span className="user-item-name">{user.name}</span>
        </div>
        <span className="user-item-status">
          {online ? "Online" : "Offline"}
        </span>
      </div>
      {unread > 0 && <span className="unread-badge">{unread}</span>}
    </button>
  );
}
