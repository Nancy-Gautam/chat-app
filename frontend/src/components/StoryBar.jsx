import { useRef } from "react";
import Avatar from "./Avatar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function StoryBar({ storyGroups, myStoryGroup, onOpenGroup, onAddStory }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  return (
    <div className="story-bar">
      <button
        className="story-avatar-btn"
        onClick={() => {
          if (myStoryGroup) onOpenGroup(myStoryGroup, 0);
          else fileInputRef.current?.click();
        }}
      >
        <div className={`story-ring ${myStoryGroup ? "has-story" : "add-story"}`}>
          <Avatar name={user.name} color={user.avatarColor} avatarUrl={user.avatarUrl} size={52} />
          {!myStoryGroup && <span className="story-plus">+</span>}
        </div>
        <span className="story-label">Your story</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAddStory(file);
          e.target.value = "";
        }}
      />

      {storyGroups
        .filter((g) => g.user._id !== user._id)
        .map((group) => (
          <button
            key={group.user._id}
            className="story-avatar-btn"
            onClick={() => onOpenGroup(group, 0)}
          >
            <div className="story-ring has-story">
              <Avatar
                name={group.user.name}
                color={group.user.avatarColor}
                avatarUrl={group.user.avatarUrl}
                size={52}
              />
            </div>
            <span className="story-label">{group.user.name.split(" ")[0]}</span>
          </button>
        ))}
    </div>
  );
}
