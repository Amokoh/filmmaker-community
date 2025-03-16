require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require("cors");
const jwt = require("jsonwebtoken"); // ✅ Import JWT

// Define PORT
const PORT = process.env.PORT || 5000;

// Ensure environment variables are set
if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
    console.error("❌ Missing required environment variables (.env file)");
    process.exit(1);
}

// Import models
const User = require('./models/User');
const Message = require('./models/Message');
const GroupMessage = require('./models/groupMessage');

// Initialize Express App 🚀
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:3000", credentials: true } });

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // ❗️ Set to true in production with HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// Import Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const groupChatRoutes = require("./routes/groupChatRoutes");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");


// Use Routes (AFTER app is initialized)
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/groupChat", groupChatRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
const friendRoutes = require("./routes/friendRoutes"); // ✅ Import the file
app.use("/api/friends", friendRoutes); // ✅ Use the correct path



// Serve Static HTML Pages
const pages = ["index", "masterclasses", "opportunity", "blog", "community", "auth", "chat", "profile"];
pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', `${page}.html`));
    });
});

// ✅ FIXED: User Profile Fetch Route
app.get("/api/user/profile", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided." });
        }

        console.log("Received token:", token); // Debugging log

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Invalid token." });
        }

        // Fetch user from database
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        console.log("User fetched successfully:", user); // Debugging log
        res.status(200).json(user);
    } catch (error) {
        console.error("🚨 Profile fetch error:", error.message);

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid or expired token." });
        }

        res.status(500).json({ message: "Server error: Failed to retrieve profile." });
    }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

// Root API route
app.get("/", (req, res) => {
    res.json({ message: "API is running..." });
});

// Socket.io - Track online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("userConnected", (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log(`User ${userId} is online.`);
    });

    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });

    socket.on("sendPrivateMessage", async ({ senderId, receiverId, message }) => {
        try {
            const roomId = [senderId, receiverId].sort().join("_");
            socket.join(roomId); // Ensure sender joins the room
            io.to(roomId).emit("receivePrivateMessage", { senderId, message });

            // Send notification if receiver is online
            if (onlineUsers.has(receiverId)) {
                io.to(onlineUsers.get(receiverId)).emit("newNotification", { senderId, message });
            }

            // Save message to database
            const newMessage = new Message({ senderId, receiverId, message });
            await newMessage.save();
        } catch (error) {
            console.error("🚨 Error saving private message:", error);
        }
    });

    socket.on("disconnect", () => {
        [...onlineUsers.entries()].forEach(([userId, socketId]) => {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                console.log(`User ${userId} went offline.`);
            }
        });
    });
});

// Start Server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
