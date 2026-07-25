import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { useVideoCall } from "../hooks/useVideoCall.js";
import Sidebar from "../components/Sidebar.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import SettingsModal from "../components/SettingsModal.jsx";
import FindPeopleModal from "../components/FindPeopleModal.jsx";
import RequestsModal from "../components/RequestsModal.jsx";
import StoryViewer from "../components/StoryViewer.jsx";
import VideoCallModal from "../components/VideoCallModal.jsx";
import "../styles/chat.css";
import "../styles/settings.css";
import "../styles/story.css";
import "../styles/call.css";

export default function Chat() {
  const { user } = useAuth();
  const { socket, onlineUserIds } = useSocket();
  const call = useVideoCall(socket, user._id);

  const [friends, setFriends] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const [typingFrom, setTypingFrom] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showFindPeople, setShowFindPeople] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  const [storyGroups, setStoryGroups] = useState([]);
  const [activeStoryView, setActiveStoryView] = useState(null); // { group, startIndex }

  const selectedUserRef = useRef(selectedUser);
  selectedUserRef.current = selectedUser;

  // Load my friends list (people I can actually chat with)
  const loadFriends = () => {
    api.get("/friends").then(({ data }) => setFriends(data)).catch(() => {});
  };

  const loadPendingCount = () => {
    api
      .get("/friends/requests")
      .then(({ data }) => setPendingRequestCount(data.length))
      .catch(() => {});
  };

  useEffect(() => {
    loadFriends();
    loadPendingCount();
  }, []);

  const loadStories = () => {
    api.get("/stories").then(({ data }) => setStoryGroups(data)).catch(() => {});
  };

  useEffect(() => {
    loadStories();
  }, []);

  const myStoryGroup = useMemo(
    () => storyGroups.find((g) => g.user._id === user._id) || null,
    [storyGroups, user._id]
  );

  // Load conversation history whenever a new user is selected
  useEffect(() => {
    if (!selectedUser) return;
    api
      .get(`/messages/${selectedUser._id}`)
      .then(({ data }) => setMessages(data))
      .catch(() => setMessages([]));

    setUnreadMap((prev) => ({ ...prev, [selectedUser._id]: 0 }));
    socket?.emit("message:seen", { sender: selectedUser._id });
  }, [selectedUser, socket]);

  // Listen for incoming real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (message) => {
      const current = selectedUserRef.current;
      const otherId =
        message.sender === user._id ? message.receiver : message.sender;

      if (current && otherId === current._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev; // avoid dupes
          return [...prev, message];
        });
        if (message.sender !== user._id) {
          socket.emit("message:seen", { sender: message.sender });
        }
      } else if (message.sender !== user._id) {
        setUnreadMap((prev) => ({
          ...prev,
          [otherId]: (prev[otherId] || 0) + 1,
        }));
      }
    };

    const handleTypingStart = ({ sender }) => {
      if (selectedUserRef.current?._id === sender) setTypingFrom(sender);
    };
    const handleTypingStop = ({ sender }) => {
      if (selectedUserRef.current?._id === sender) setTypingFrom(null);
    };

    const handleFriendRequest = () => setPendingRequestCount((c) => c + 1);
    const handleFriendAccepted = () => loadFriends();

    socket.on("message:receive", handleReceive);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("friend:request", handleFriendRequest);
    socket.on("friend:accepted", handleFriendAccepted);

    return () => {
      socket.off("message:receive", handleReceive);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("friend:request", handleFriendRequest);
      socket.off("friend:accepted", handleFriendAccepted);
    };
  }, [socket, user._id]);

  const handleSend = (text) => {
    if (!selectedUser || !socket) return;
    socket.emit("message:send", { receiver: selectedUser._id, text });
  };

  const handleSendFile = async (file) => {
    if (!selectedUser) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("receiver", selectedUser._id);
      // The backend broadcasts the saved message over socket.io itself,
      // so we don't need to add it to local state manually here.
      await api.post("/messages/upload", formData);
    } catch (err) {
      alert(err.response?.data?.message || "Could not send file");
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = (isTyping) => {
    if (!selectedUser || !socket) return;
    socket.emit(isTyping ? "typing:start" : "typing:stop", {
      receiver: selectedUser._id,
    });
  };

  const isTyping = useMemo(
    () => typingFrom && typingFrom === selectedUser?._id,
    [typingFrom, selectedUser]
  );

  // ---- Stories ----
  const handleAddStory = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post("/stories", formData);
      loadStories();
    } catch (err) {
      alert(err.response?.data?.message || "Could not post story");
    }
  };

  const handleViewStory = (story) => {
    api.post(`/stories/${story._id}/view`).catch(() => {});
  };

  const handleDeleteStory = async (story) => {
    try {
      await api.delete(`/stories/${story._id}`);
      setActiveStoryView(null);
      loadStories();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete story");
    }
  };

  return (
    <div className={`chat-app ${selectedUser ? "has-selected" : ""}`}>
      <Sidebar
        friends={friends}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        onlineUserIds={onlineUserIds}
        unreadMap={unreadMap}
        storyGroups={storyGroups}
        myStoryGroup={myStoryGroup}
        onOpenStoryGroup={(group, idx) => setActiveStoryView({ group, startIndex: idx })}
        onAddStory={handleAddStory}
        onOpenSettings={() => setShowSettings(true)}
        onOpenFindPeople={() => setShowFindPeople(true)}
        onOpenRequests={() => setShowRequests(true)}
        pendingRequestCount={pendingRequestCount}
      />
      <ChatWindow
        selectedUser={selectedUser}
        messages={messages}
        myId={user._id}
        onSend={handleSend}
        onSendFile={handleSendFile}
        uploading={uploading}
        onTyping={handleTyping}
        isTyping={isTyping}
        online={selectedUser ? onlineUserIds.has(selectedUser._id) : false}
        onBack={() => setSelectedUser(null)}
        onStartCall={(peer, type) => call.startCall(peer, type)}
      />

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {showFindPeople && (
        <FindPeopleModal
          onClose={() => setShowFindPeople(false)}
          onRequestSent={() => {}}
        />
      )}

      {showRequests && (
        <RequestsModal
          onClose={() => setShowRequests(false)}
          onChanged={() => {
            loadFriends();
            loadPendingCount();
          }}
        />
      )}

      {activeStoryView && (
        <StoryViewer
          group={activeStoryView.group}
          startIndex={activeStoryView.startIndex}
          onClose={() => setActiveStoryView(null)}
          onView={handleViewStory}
          onDelete={handleDeleteStory}
        />
      )}

      {call.callState && (
        <VideoCallModal
          callState={call.callState}
          localStream={call.localStream}
          remoteStream={call.remoteStream}
          onAccept={call.acceptCall}
          onDecline={call.declineCall}
          onEnd={call.endCall}
        />
      )}
    </div>
  );
}
