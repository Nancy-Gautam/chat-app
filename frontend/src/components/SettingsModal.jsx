import { useRef, useState } from "react";
import Avatar from "./Avatar.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function SettingsModal({ onClose }) {
  const { user, setUser, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user.name);
  const [about, setAbout] = useState(user.about || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarPick = async (file) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const { data } = await api.post("/users/avatar", formData);
      setUser(data);
    } catch (err) {
      alert(err.response?.data?.message || "Could not upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const { data } = await api.put("/users/profile", { name, about });
      setUser(data);
      setProfileMsg("Saved ✓");
    } catch (err) {
      setProfileMsg(err.response?.data?.message || "Could not save");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMsg("");
    try {
      await api.put("/users/password", { currentPassword, newPassword });
      setPasswordMsg("Password updated ✓");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordMsg(err.response?.data?.message || "Could not update password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {/* Profile picture */}
          <section className="settings-section">
            <div className="settings-avatar-row">
              <Avatar name={user.name} color={user.avatarColor} avatarUrl={user.avatarUrl} size={72} />
              <div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? "Uploading…" : "Change photo"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarPick(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          </section>

          {/* Name + about */}
          <section className="settings-section">
            <h3>Profile</h3>
            <form onSubmit={handleProfileSave} className="settings-form">
              <div className="field">
                <label>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field">
                <label>About</label>
                <input
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  maxLength={140}
                  placeholder="Hey there! I'm using Let's Chat."
                />
              </div>
              {profileMsg && <p className="settings-msg">{profileMsg}</p>}
              <button className="btn-primary" type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save profile"}
              </button>
            </form>
          </section>

          {/* Password */}
          <section className="settings-section">
            <h3>Change password</h3>
            <form onSubmit={handlePasswordSave} className="settings-form">
              <div className="field">
                <label>Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              {passwordMsg && <p className="settings-msg">{passwordMsg}</p>}
              <button className="btn-primary" type="submit" disabled={savingPassword}>
                {savingPassword ? "Updating…" : "Update password"}
              </button>
            </form>
          </section>

          <section className="settings-section">
            <button className="btn-danger" onClick={logout}>Log out</button>
          </section>
        </div>
      </div>
    </div>
  );
}
