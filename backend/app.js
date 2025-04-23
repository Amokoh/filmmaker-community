const express = require("express");
const session = require("express-session");
const passport = require("passport");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");

const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/filmmakerDB";

mongoose.connect(mongoURI)
  .then(() => {
    console.log(`✅ Connected to MongoDB at ${mongoURI}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "https://storysharestudio.com",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ✅ Store connected users for real-time updates
const connectedUsers = new Map();

// ✅ Handle socket.io connections
io.on("connection", (socket) => {
  console.log("📡 A user connected:", socket.id);

  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      connectedUsers.set(userId, socket.id);
      console.log(`🔐 Authenticated socket for user: ${userId}`);

      socket.on("disconnect", () => {
        connectedUsers.delete(userId);
        console.log("❌ User disconnected:", socket.id);
      });

    } catch (err) {
      console.warn("⚠️ Socket authentication failed:", err.message);
    }
  } else {
    console.warn("⚠️ No token provided via socket.auth");
  }
});

// ✅ Middlewares
app.use(cors({
  origin: "https://storysharestudio.com",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "your_secret_key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}));
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const groupChatRoutes = require("./routes/groupChatRoutes");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const friendRoutes = require("./routes/friendRoutes")(io, connectedUsers); // ✅ corrected



app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/groupChat", groupChatRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/friends", friendRoutes);

// ✅ Serve frontend and static files
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath, { extensions: ["html"] }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

["index", "masterclasses", "opportunity", "blog", "community", "auth"].forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(frontendPath, `${page}.html`));
  });
});
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ✅ Error Handling
app.use((req, res) => {
  res.status(404).json({ error: "❌ Route not found" });
});
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ error: "⚠️ Internal Server Error" });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

// ✅ Export for use in routes
module.exports = { app, server, io, connectedUsers };

