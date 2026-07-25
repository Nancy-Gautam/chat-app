import { useMemo, useState } from "react";
import Avatar from "./Avatar.jsx";
import UserListItem from "./UserListItem.jsx";
import StoryBar from "./StoryBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Sidebar({
  friends,
  selectedUser,
  onSelectUser,
  onlineUserIds,
  unreadMap,
  storyGroups,
  myStoryGroup,
  onOpenStoryGroup,
  onAddStory,
  onOpenSettings,
  onOpenFindPeople,
  onOpenRequests,
  pendingRequestCount,
}) {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return friends;
    return friends.filter((u) =>
      u.name.toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [friends, query]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Logo" className="auth-brand-mark" />
          <span>Whisperly</span>
        </div>
        <div className="sidebar-header-actions">
          <button
            className="logout-btn"
            onClick={onOpenRequests}
            title="Friend requests"
          >
            🔔
            {pendingRequestCount > 0 && (
              <span className="notif-badge">{pendingRequestCount}</span>
            )}
          </button>
          <button className="logout-btn" onClick={onOpenFindPeople} title="Find people">
            ➕
          </button>
        </div>
      </div>

      <StoryBar
        storyGroups={storyGroups}
        myStoryGroup={myStoryGroup}
        onOpenGroup={onOpenStoryGroup}
        onAddStory={onAddStory}
      />

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search your friends…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="sidebar-list">
        {friends.length === 0 && (
          <p className="sidebar-empty">
            No friends yet — tap ➕ above to find people and send requests.
          </p>
        )}
        {friends.length > 0 && filtered.length === 0 && (
          <p className="sidebar-empty">No one matches "{query}".</p>
        )}
        {filtered.map((u) => (
          <UserListItem
            key={u._id}
            user={u}
            active={selectedUser?._id === u._id}
            online={onlineUserIds.has(u._id)}
            unread={unreadMap[u._id] || 0}
            onClick={() => onSelectUser(u)}
          />
        ))}
      </div>

      <div className="sidebar-footer">
        <Avatar name={user.name} color={user.avatarColor} avatarUrl={user.avatarUrl} size={36} />
        <div className="sidebar-footer-info">
          <span className="sidebar-footer-name">{user.name}</span>
          <span className="sidebar-footer-email">{user.email}</span>
        </div>
        <button className="logout-btn" onClick={onOpenSettings} title="Settings">
          ⚙️
        </button>
        <button className="logout-btn" onClick={logout} title="Log out">
          ⏻
        </button>
      </div>
    </aside>
  );
}
