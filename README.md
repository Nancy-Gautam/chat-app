# Let's Chat 💬

Ek simple, attractive aur responsive **MERN stack real-time chat app**.
MongoDB + Express + React (Vite) + Node.js, real-time messaging ke liye **Socket.io** ke saath.

**Features:**
- Signup / Login (JWT authentication, password bcrypt se hashed)
- Real-time one-to-one chat (Socket.io)
- Profile picture upload, name & "about" text editing
- Send photos, GIFs, videos, audio clips, and files
- Emoji picker
- One-to-one voice & video calling (WebRTC, peer-to-peer)
- Stories / Status — 24-hour disappearing photo, video, or text updates
- Settings: edit profile, change password, log out
- Online / Offline status
- "Typing…" indicator
- Unread message badge
- Unique "folded-note" style chat bubbles
- Fully responsive (mobile + desktop)

Poori setup guide neeche di gayi hai — step by step.

## Naye Features Ke Liye Zaroori Baatein

- **Camera/Mic Permission**: Video/voice call ke liye browser camera aur microphone access maangega — "Allow" karna zaroori hai.
- **File uploads**: `backend/uploads/` folder mein save hote hain (avatars aur media alag folders mein). Ye folder `.gitignore` mein hai, isliye agar git use kar rahe ho to actual files push nahi hongi (sirf `.gitkeep` placeholders).
- **Video call sirf ek network ke andar reliably chalega** bina extra setup ke (dono log same WiFi/local network par). Alag-alag networks (jaise ek ghar se ek office se) ke beech call kabhi kabhi TURN server ki zaroorat padti hai — agar aisa issue aaye to bata dena, TURN server setup guide de dunga.

