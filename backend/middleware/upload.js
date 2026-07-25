const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Make sure upload folders exist
const avatarDir = path.join(__dirname, "..", "uploads", "avatars");
const mediaDir = path.join(__dirname, "..", "uploads", "media");
[avatarDir, mediaDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function makeStorage(destDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, destDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${ext}`);
    },
  });
}

// Avatars: images only, 5MB limit
const avatarUpload = multer({
  storage: makeStorage(avatarDir),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed for avatars"));
  },
});

// Chat media: images, videos, audio, and generic files, 25MB limit
const mediaUpload = multer({
  storage: makeStorage(mediaDir),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Decide message "type" from a multer file's mimetype
function resolveMessageType(mimetype) {
  if (mimetype.startsWith("image/gif")) return "gif";
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "file";
}

module.exports = { avatarUpload, mediaUpload, resolveMessageType };
