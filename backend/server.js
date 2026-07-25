require("dotenv").config();
const path = require("path");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { initSocket } = require("./socket/socket");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const storyRoutes = require("./routes/storyRoutes");
const friendRoutes = require("./routes/friendRoutes");

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// Serve uploaded avatars / media files (e.g. http://localhost:5000/uploads/avatars/xyz.jpg)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/friends", friendRoutes);

app.get("/", (req, res) => {
  res.send("Let's Chat API is running 🚀");
});

// Socket.io setup
const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true },
  maxHttpBufferSize: 1e7, // 10MB, headroom for future socket-based transfers
});
initSocket(io);

// Make the io instance available inside REST routes (e.g. /api/messages/upload
// uses this to broadcast the new message to both users in real time)
app.set("io", io);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
