const express = require("express");
const Story = require("../models/Story");
const { protect } = require("../middleware/authMiddleware");
const { mediaUpload, resolveMessageType } = require("../middleware/upload");

const router = express.Router();

// @route   GET /api/stories
// @desc    Get everyone's active (non-expired) stories, grouped by user,
//          newest story first within each user's group.
router.get("/", protect, async (req, res) => {
  try {
    const stories = await Story.find({ expiresAt: { $gt: new Date() } })
      .populate("user", "name avatarColor avatarUrl")
      .sort({ createdAt: -1 });

    const grouped = {};
    for (const story of stories) {
      const uid = String(story.user._id);
      if (!grouped[uid]) {
        grouped[uid] = { user: story.user, stories: [] };
      }
      grouped[uid].stories.push(story);
    }
    // Oldest-first within each group so stories play in order
    Object.values(grouped).forEach((g) => g.stories.reverse());

    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   POST /api/stories
// @desc    Create a new story — either a media upload (image/video) or a
//          text-only story (no file, just caption + backgroundColor)
router.post("/", protect, mediaUpload.single("file"), async (req, res) => {
  try {
    const { caption, backgroundColor } = req.body;

    let type = "text";
    let mediaUrl = null;

    if (req.file) {
      const resolved = resolveMessageType(req.file.mimetype);
      type = resolved === "video" ? "video" : "image";
      mediaUrl = `/uploads/media/${req.file.filename}`;
    } else if (!caption || !caption.trim()) {
      return res.status(400).json({ message: "A text story needs a caption" });
    }

    const story = await Story.create({
      user: req.user._id,
      type,
      mediaUrl,
      caption: caption?.trim() || "",
      backgroundColor: backgroundColor || "#5B4EFF",
    });

    const populated = await story.populate("user", "name avatarColor avatarUrl");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   POST /api/stories/:id/view
// @desc    Mark a story as viewed by the logged-in user
router.post("/:id/view", protect, async (req, res) => {
  try {
    await Story.updateOne(
      { _id: req.params.id },
      { $addToSet: { viewers: req.user._id } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   DELETE /api/stories/:id
// @desc    Delete your own story early
router.delete("/:id", protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });
    if (String(story.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own story" });
    }
    await story.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
