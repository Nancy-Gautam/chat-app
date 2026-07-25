const mongoose = require("mongoose");

const friendRequestSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// A pair of users should only ever have one active request/friendship between them
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

module.exports = mongoose.model("FriendRequest", friendRequestSchema);