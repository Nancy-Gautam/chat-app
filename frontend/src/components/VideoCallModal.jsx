import { useEffect, useRef } from "react";
import Avatar from "./Avatar.jsx";

export default function VideoCallModal({
  callState,
  localStream,
  remoteStream,
  onAccept,
  onDecline,
  onEnd,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream || null;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream || null;
  }, [remoteStream]);

  if (!callState) return null;

  const { status, peer, callType } = callState;
  const isVideo = callType === "video";

  return (
    <div className="call-overlay">
      <div className="call-modal">
        {isVideo && status === "connected" ? (
          <div className="call-video-stage">
            <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />
            <video ref={localVideoRef} className="local-video" autoPlay playsInline muted />
          </div>
        ) : (
          <div className="call-audio-stage">
            <Avatar
              name={peer.name}
              color={peer.avatarColor}
              avatarUrl={peer.avatarUrl}
              size={96}
            />
            <h2>{peer.name}</h2>
            <p className="call-status-text">
              {status === "calling" && `Calling… (${isVideo ? "video" : "voice"})`}
              {status === "ringing" && `Incoming ${isVideo ? "video" : "voice"} call…`}
              {status === "connected" && "Connected"}
            </p>
            {/* Keep audio flowing even in "audio-only" mode via hidden elements */}
            <video ref={remoteVideoRef} autoPlay playsInline style={{ display: "none" }} />
            <video ref={localVideoRef} autoPlay playsInline muted style={{ display: "none" }} />
          </div>
        )}

        <div className="call-controls">
          {status === "ringing" ? (
            <>
              <button className="call-btn call-btn-decline" onClick={onDecline}>
                ✕ Decline
              </button>
              <button className="call-btn call-btn-accept" onClick={onAccept}>
                ✓ Accept
              </button>
            </>
          ) : (
            <button className="call-btn call-btn-decline" onClick={onEnd}>
              ✕ End call
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
