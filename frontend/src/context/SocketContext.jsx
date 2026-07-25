import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";
import { API_URL } from "../api/axios.js";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  useEffect(() => {
    if (!user) return;

    const socket = io(API_URL, {
      auth: { token: user.token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("user:online", ({ userId }) => {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    });

    socket.on("user:offline", ({ userId }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, connected, onlineUserIds }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
