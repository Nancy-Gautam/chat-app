const express = require("express");
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/friends
// @desc    Get my accepted friends list (this is who shows up in the chat sidebar)
router.get("/", protect, async (req, res) => {
  try {
    const myId = req.user._id;
    const accepted = await FriendRequest.find({
      status: "accepted",
      $or: [{ sender: myId }, { receiver: myId }],
    }).populate("sender receiver", "name email avatarColor avatarUrl about isOnline lastSeen");

    // Each record has "me" on one side and "them" on the other — pull out "them"
    const friends = accepted.map((r) => {
      const other = String(r.sender._id) === String(myId) ? r.receiver : r.sender;
      return other;
    });

    res.json(friends);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   GET /api/friends/requests
// @desc    Get pending requests sent TO me (need my accept/decline)
router.get("/requests", protect, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: "pending",
    }).populate("sender", "name email avatarColor avatarUrl about");

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   GET /api/friends/sent
// @desc    Get pending requests I sent (so "Discover" can show "Requested")
router.get("/sent", protect, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.user._id,
      status: "pending",
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   GET /api/friends/discover?q=search
// @desc    Find people who are NOT already a friend and have no pending
//          request with me in either direction — for the "Find People" screen
router.get("/discover", protect, async (req, res) => {
  try {
    const myId = req.user._id;
    const q = (req.query.q || "").trim();

    const relatedDocs = await FriendRequest.find({
      $or: [{ sender: myId }, { receiver: myId }],
    });
    const excludedIds = new Set([String(myId)]);
    relatedDocs.forEach((r) => {
      excludedIds.add(String(r.sender));
      excludedIds.add(String(r.receiver));
    });

    const filter = { _id: { $nin: Array.from(excludedIds) } };
    if (q) filter.name = { $regex: q, $options: "i" };

    const users = await User.find(filter)
      .select("name email avatarColor avatarUrl about")
      .limit(30);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   POST /api/friends/request/:userId
// @desc    Send a friend request to userId
router.post("/request/:userId", protect, async (req, res) => {
  try {
    const receiverId = req.params.userId;
    if (receiverId === String(req.user._id)) {
      return res.status(400).json({ message: "You can't send a request to yourself" });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: receiverId },
        { sender: receiverId, receiver: req.user._id },
      ],
    });
    if (existing) {
      return res.status(400).json({ message: "A request already exists with this person" });
    }

    const request = await FriendRequest.create({
      sender: req.user._id,
      receiver: receiverId,
    });
    const populated = await request.populate("sender", "name email avatarColor avatarUrl about");

    // Notify the receiver in real time, if they're online
    const io = req.app.get("io");
    if (io) io.to(String(receiverId)).emit("friend:request", populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   POST /api/friends/:requestId/accept
router.post("/:requestId/accept", protect, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.receiver) !== String(req.user._id)) {
      return res.status(403).json({ message: "This request isn't addressed to you" });
    }

    request.status = "accepted";
    await request.save();

    const io = req.app.get("io");
    if (io) {
      io.to(String(request.sender)).emit("friend:accepted", {
        by: req.user._id,
        user: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          avatarColor: req.user.avatarColor,
          avatarUrl: req.user.avatarUrl,
          about: req.user.about,
        },
      });
    }

    res.json({ message: "Friend request accepted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   POST /api/friends/:requestId/reject
// @desc    Decline an incoming request (deletes it so they could try again later)
router.post("/:requestId/reject", protect, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.receiver) !== String(req.user._id)) {
      return res.status(403).json({ message: "This request isn't addressed to you" });
    }
    await request.deleteOne();
    res.json({ message: "Friend request declined" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   DELETE /api/friends/:requestId/cancel
// @desc    Cancel a request I sent, before the other person responds
router.delete("/:requestId/cancel", protect, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.sender) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only cancel your own request" });
    }
    await request.deleteOne();
    res.json({ message: "Request cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;