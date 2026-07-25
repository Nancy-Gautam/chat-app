const express = require("express");
const Message = require("../models/Message");
const { protect } = require("../middleware/authMiddleware");
const { mediaUpload, resolveMessageType } = require("../middleware/upload");

const router = express.Router();

// @route   GET /api/messages/:userId
// @desc    Get full conversation between logged-in user and :userId
router.get("/:userId", protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    }).sort({ createdAt: 1 });

    // Mark messages sent to me as seen
    await Message.updateMany(
      { sender: userId, receiver: myId, seen: false },
      { $set: { seen: true } }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   POST /api/messages
// @desc    Save a text message (also emitted live via socket.io from the client)
router.post("/", protect, async (req, res) => {
  try {
    const { receiver, text } = req.body;
    if (!receiver || !text || !text.trim()) {
      return res.status(400).json({ message: "receiver and text are required" });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      type: "text",
      text: text.trim(),
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   POST /api/messages/upload
// @desc    Upload a photo / video / audio / file / GIF and save it as a message.
//          The req.app.get("io") instance is used to broadcast it in real time,
//          the same way text messages sent through socket.io are broadcast.
router.post("/upload", protect, mediaUpload.single("file"), async (req, res) => {
  try {
    const { receiver } = req.body;
    if (!receiver) {
      return res.status(400).json({ message: "receiver is required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const type = resolveMessageType(req.file.mimetype);

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      type,
      fileUrl: `/uploads/media/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileMimeType: req.file.mimetype,
    });

    // Broadcast in real time to both people in the conversation
    const io = req.app.get("io");
    if (io) {
      io.to(String(receiver)).emit("message:receive", message);
      io.to(String(req.user._id)).emit("message:receive", message);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
