const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video", "text"],
      default: "image",
    },
    mediaUrl: { type: String, default: null }, // set for image/video stories
    caption: { type: String, default: "", maxlength: 200 },
    backgroundColor: { type: String, default: "#5B4EFF" }, // used for text-only stories
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Stories auto-expire after 24 hours, just like most chat apps
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// MongoDB TTL index: automatically deletes the document once expiresAt passes
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Story", storySchema);
