const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

// Keeps track of which userId is connected on which socket id
const onlineUsers = new Map();

function initSocket(io) {
  // Authenticate every socket connection using the JWT the client sends
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit("user:online", { userId });

    console.log(`🟢 User connected: ${userId} (${socket.id})`);

    // Client asks to join their personal room (used for targeted events)
    socket.join(userId);

    // Real-time message send
    socket.on("message:send", async ({ receiver, text }) => {
      if (!receiver || !text || !text.trim()) return;

      try {
        const message = await Message.create({
          sender: userId,
          receiver,
          text: text.trim(),
        });

        // Send to receiver if online
        io.to(receiver).emit("message:receive", message);
        // Echo back to sender (so all their open tabs update too)
        io.to(userId).emit("message:receive", message);
      } catch (err) {
        socket.emit("message:error", { message: "Failed to send message" });
      }
    });

    // Typing indicator
    socket.on("typing:start", ({ receiver }) => {
      if (receiver) io.to(receiver).emit("typing:start", { sender: userId });
    });

    socket.on("typing:stop", ({ receiver }) => {
      if (receiver) io.to(receiver).emit("typing:stop", { sender: userId });
    });

    // Mark messages as seen in real time
    socket.on("message:seen", async ({ sender }) => {
      if (!sender) return;
      await Message.updateMany(
        { sender, receiver: userId, seen: false },
        { $set: { seen: true } }
      );
      io.to(sender).emit("message:seenAck", { by: userId });
    });

    // ---------- WebRTC video/audio call signaling ----------
    // These events just relay signaling data between the two peers;
    // the actual audio/video stream travels directly between browsers (WebRTC).

    // Caller starts a call: tell the other person, carrying the SDP offer
    socket.on("call:offer", async ({ to, offer, callType }) => {
      if (!to) return;
      const fromUser = await User.findById(userId).select(
        "name avatarColor avatarUrl"
      );
      io.to(to).emit("call:incoming", { from: userId, offer, callType, fromUser });
    });

    // Callee accepts: send the SDP answer back to the caller
    socket.on("call:answer", ({ to, answer }) => {
      if (!to) return;
      io.to(to).emit("call:answered", { from: userId, answer });
    });

    // Both sides exchange ICE candidates as they're discovered
    socket.on("call:ice-candidate", ({ to, candidate }) => {
      if (!to) return;
      io.to(to).emit("call:ice-candidate", { from: userId, candidate });
    });

    // Callee declines, or either side hangs up / cancels
    socket.on("call:decline", ({ to }) => {
      if (to) io.to(to).emit("call:declined", { from: userId });
    });

    socket.on("call:end", ({ to }) => {
      if (to) io.to(to).emit("call:ended", { from: userId });
    });

    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      io.emit("user:offline", { userId, lastSeen: new Date() });
      console.log(`🔴 User disconnected: ${userId}`);
    });
  });
}

module.exports = { initSocket, onlineUsers };
