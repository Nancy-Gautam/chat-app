import { useCallback, useEffect, useRef, useState } from "react";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// Manages the full WebRTC lifecycle for one-to-one audio/video calls.
// Signaling (who wants to call whom, SDP offers/answers, ICE candidates)
// travels over the existing socket.io connection; the actual audio/video
// stream flows directly between the two browsers (peer-to-peer).
export function useVideoCall(socket, myId) {
  const [callState, setCallState] = useState(null);
  // callState: null | { status: 'calling'|'ringing'|'connected', peer, callType }

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const pcRef = useRef(null);
  const pendingOfferRef = useRef(null); // stores incoming offer until user accepts

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    pendingOfferRef.current = null;
    setCallState(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream]);

  const createPeerConnection = useCallback(
    (peerId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("call:ice-candidate", { to: peerId, candidate: e.candidate });
        }
      };

      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0]);
      };

      pcRef.current = pc;
      return pc;
    },
    [socket]
  );

  // ---- Outgoing call ----
  const startCall = useCallback(
    async (peerUser, callType) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === "video",
          audio: true,
        });
        setLocalStream(stream);
        setCallState({ status: "calling", peer: peerUser, callType });

        const pc = createPeerConnection(peerUser._id);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("call:offer", { to: peerUser._id, offer, callType });
      } catch (err) {
        console.error("Could not start call:", err);
        alert("Couldn't access camera/microphone. Please check permissions.");
        cleanup();
      }
    },
    [socket, createPeerConnection, cleanup]
  );

  // ---- Accept an incoming call ----
  const acceptCall = useCallback(async () => {
    if (!callState || !pendingOfferRef.current) return;
    try {
      const { offer } = pendingOfferRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callState.callType === "video",
        audio: true,
      });
      setLocalStream(stream);

      const pc = createPeerConnection(callState.peer._id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:answer", { to: callState.peer._id, answer });
      setCallState((prev) => ({ ...prev, status: "connected" }));
    } catch (err) {
      console.error("Could not accept call:", err);
      alert("Couldn't access camera/microphone. Please check permissions.");
      cleanup();
    }
  }, [callState, socket, createPeerConnection, cleanup]);

  const declineCall = useCallback(() => {
    if (callState?.peer) socket.emit("call:decline", { to: callState.peer._id });
    cleanup();
  }, [callState, socket, cleanup]);

  const endCall = useCallback(() => {
    if (callState?.peer) socket.emit("call:end", { to: callState.peer._id });
    cleanup();
  }, [callState, socket, cleanup]);

  // ---- Socket event listeners ----
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = ({ from, offer, callType, fromUser }) => {
      pendingOfferRef.current = { offer };
      setCallState({
        status: "ringing",
        peer: fromUser || { _id: from, name: "Someone" },
        callType,
      });
    };

    const handleAnswered = async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState((prev) => (prev ? { ...prev, status: "connected" } : prev));
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      try {
        if (pcRef.current && candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };

    const handleDeclined = () => cleanup();
    const handleEnded = () => cleanup();

    socket.on("call:incoming", handleIncoming);
    socket.on("call:answered", handleAnswered);
    socket.on("call:ice-candidate", handleIceCandidate);
    socket.on("call:declined", handleDeclined);
    socket.on("call:ended", handleEnded);

    return () => {
      socket.off("call:incoming", handleIncoming);
      socket.off("call:answered", handleAnswered);
      socket.off("call:ice-candidate", handleIceCandidate);
      socket.off("call:declined", handleDeclined);
      socket.off("call:ended", handleEnded);
    };
  }, [socket, cleanup]);

  return { callState, localStream, remoteStream, startCall, acceptCall, declineCall, endCall };
}
