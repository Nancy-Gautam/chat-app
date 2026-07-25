const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 40,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    avatarColor: {
      type: String,
      default: function () {
        const colors = ["#FF5D73", "#2DD4BF", "#F5A623", "#7C5CFF", "#3AB0FF"];
        return colors[Math.floor(Math.random() * colors.length)];
      },
    },
    // Relative path like "/uploads/avatars/xxx.jpg", null = no photo (initials shown instead)
    avatarUrl: {
      type: String,
      default: null,
    },
    about: {
      type: String,
      default: "Hey there! I'm using Let's Chat.",
      maxlength: 140,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
