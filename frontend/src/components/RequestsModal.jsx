import { useEffect, useState } from "react";
import Avatar from "./Avatar.jsx";
import api from "../api/axios.js";

export default function RequestsModal({ onClose, onChanged }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get("/friends/requests")
      .then(({ data }) => setRequests(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async (id) => {
    try {
      await api.post(`/friends/${id}/accept`);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      onChanged?.();
    } catch (err) {
      alert(err.response?.data?.message || "Could not accept request");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/friends/${id}/reject`);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      onChanged?.();
    } catch (err) {
      alert(err.response?.data?.message || "Could not decline request");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Friend requests</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {loading && <p className="settings-msg">Loading…</p>}
          {!loading && requests.length === 0 && (
            <p className="settings-msg">No pending requests.</p>
          )}

          <div className="discover-list">
            {requests.map((r) => (
              <div key={r._id} className="discover-item">
                <Avatar
                  name={r.sender.name}
                  color={r.sender.avatarColor}
                  avatarUrl={r.sender.avatarUrl}
                  size={44}
                />
                <div className="discover-item-info">
                  <span className="discover-item-name">{r.sender.name}</span>
                  <span className="discover-item-about">{r.sender.about}</span>
                </div>
                <div className="request-actions">
                  <button className="btn-secondary" onClick={() => handleReject(r._id)}>
                    Decline
                  </button>
                  <button className="btn-primary-sm" onClick={() => handleAccept(r._id)}>
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}