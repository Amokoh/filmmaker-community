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
const jwt = require("jsonwebtoken");

// ✅ Define PORT
const PORT = process.env.PORT || 5000;

// ✅ Ensure required environment variables are set
if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
    console.error("❌ Missing required environment variables (.env file)");
    process.exit(1);
}

// ✅ Initialize Express App
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5000", credentials: true } });

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {})
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// ✅ Middleware
app.use(cors({ origin: "http://localhost:5000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ✅ Serve Static Files from Frontend
const frontendPath = path.resolve(__dirname, "../frontend/public");
app.use(express.static(frontendPath));

// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// ✅ Import Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const groupChatRoutes = require("./routes/groupChatRoutes");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const friendRoutes = require("./routes/friendRoutes");

// ✅ Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/groupChat", groupChatRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/friends", friendRoutes);

// ✅ Serve Static HTML Pages from Frontend
const pages = ["index", "masterclasses", "opportunity", "blog", "community", "auth", "chat", "profile"];
pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        const filePath = path.join(frontendPath, `${page}.html`);
        console.log(`Serving: ${filePath}`);

        res.sendFile(filePath, (err) => {
            if (err) {
                console.error(`❌ Error serving ${page}.html:`, err);
                res.status(500).send("Error loading page.");
            }
        });
    });
});

// ✅ Root Route (Serve index.html)
app.get("/", (req, res) => {
    const filePath = path.join(frontendPath, "index.html");
    console.log(`Serving: ${filePath}`);

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("❌ Error serving index.html:", err);
            res.status(500).send("Error loading homepage.");
        }
    });
});

// ✅ Start Server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
