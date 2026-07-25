import { useEffect, useState } from "react";
import Avatar from "./Avatar.jsx";
import api from "../api/axios.js";

export default function FindPeopleModal({ onClose, onRequestSent }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [sentIds, setSentIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const search = async (q) => {
    setLoading(true);
    try {
      const { data } = await api.get("/friends/discover", { params: { q } });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search(""); // show everyone discoverable on open
    api.get("/friends/sent").then(({ data }) => {
      setSentIds(new Set(data.map((r) => String(r.receiver))));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSendRequest = async (userId) => {
    try {
      await api.post(`/friends/request/${userId}`);
      setSentIds((prev) => new Set(prev).add(userId));
      onRequestSent?.();
    } catch (err) {
      alert(err.response?.data?.message || "Could not send request");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Find people</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <div className="field" style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {loading && <p className="settings-msg">Searching…</p>}
          {!loading && results.length === 0 && (
            <p className="settings-msg">No one new to find right now.</p>
          )}

          <div className="discover-list">
            {results.map((u) => {
              const alreadySent = sentIds.has(u._id);
              return (
                <div key={u._id} className="discover-item">
                  <Avatar name={u.name} color={u.avatarColor} avatarUrl={u.avatarUrl} size={44} />
                  <div className="discover-item-info">
                    <span className="discover-item-name">{u.name}</span>
                    <span className="discover-item-about">{u.about}</span>
                  </div>
                  <button
                    className={alreadySent ? "btn-secondary" : "btn-primary-sm"}
                    disabled={alreadySent}
                    onClick={() => handleSendRequest(u._id)}
                  >
                    {alreadySent ? "Requested" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}