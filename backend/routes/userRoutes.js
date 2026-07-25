const express = require("express");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const { avatarUpload } = require("../middleware/upload");

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users except the logged-in one, for the sidebar list
router.get("/", protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name email avatarColor avatarUrl about isOnline lastSeen")
      .sort({ isOnline: -1, name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update name and/or about text
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, about } = req.body;
    if (name !== undefined) req.user.name = name.trim();
    if (about !== undefined) req.user.about = about.trim().slice(0, 140);
    await req.user.save();
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   POST /api/users/avatar
// @desc    Upload/replace the logged-in user's profile picture
router.post("/avatar", protect, avatarUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    // Delete the old avatar file from disk, if any
    if (req.user.avatarUrl) {
      const oldPath = path.join(__dirname, "..", req.user.avatarUrl);
      fs.unlink(oldPath, () => {}); // ignore errors (file may not exist)
    }

    req.user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await req.user.save();

    res.json(req.user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   PUT /api/users/password
// @desc    Change the logged-in user's password
router.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const userWithPassword = await User.findById(req.user._id).select("+password");
    const match = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    userWithPassword.password = await bcrypt.hash(newPassword, salt);
    await userWithPassword.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
