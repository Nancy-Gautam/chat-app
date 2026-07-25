const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "gif", "video", "audio", "file"],
      default: "text",
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    // Populated only for non-text message types
    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    fileSize: { type: Number, default: null }, // bytes
    fileMimeType: { type: String, default: null },
    seen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Speeds up fetching a conversation between two users, sorted by time
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
