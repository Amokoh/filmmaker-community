const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middlewares/authMiddleware");
const multer = require("multer");

// ✅ Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// ✅ GET All User Profiles (Public)
router.get("/profiles", async (req, res) => {
    try {
        const users = await User.find().select("username bio profilePicture socialHandles");
        res.json(users);
    } catch (error) {
        console.error("🚨 Error fetching all profiles:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Send a Friend Request
router.post("/send-friend-request", protect, async (req, res) => {
    try {
        const { recipientId } = req.body;
        const senderId = req.user.id;

        if (senderId === recipientId) {
            return res.status(400).json({ message: "You cannot send a request to yourself." });
        }

        const recipient = await User.findById(recipientId);
        if (!recipient) return res.status(404).json({ message: "User not found." });

        if (recipient.friendRequests.includes(senderId)) {
            return res.status(400).json({ message: "Request already sent." });
        }

        if (recipient.friends.includes(senderId)) {
            return res.status(400).json({ message: "You are already friends with this user." });
        }

        recipient.friendRequests.push(senderId);
        await recipient.save();

        // Emit real-time notification
        req.io.to(recipientId).emit("friendRequest", { senderId });

        res.json({ message: "Friend request sent!" });
    } catch (error) {
        console.error("🚨 Error sending friend request:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Get Friend Requests (Received)
router.get("/friend-requests", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("friendRequests", "username email profilePicture");
        res.json(user.friendRequests);
    } catch (error) {
        console.error("🚨 Error fetching friend requests:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Accept Friend Request
router.post("/accept-friend-request", protect, async (req, res) => {
    try {
        const { senderId } = req.body;
        const recipientId = req.user.id;

        const sender = await User.findById(senderId);
        const recipient = await User.findById(recipientId);

        if (!sender || !recipient) return res.status(404).json({ message: "User not found." });

        recipient.friendRequests = recipient.friendRequests.filter(id => id.toString() !== senderId);
        recipient.friends.push(senderId);
        sender.friends.push(recipientId);

        await recipient.save();
        await sender.save();

        res.json({ message: "Friend request accepted!" });
    } catch (error) {
        console.error("🚨 Error accepting friend request:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Fetch User Friends
router.get("/friends", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("friends", "username email profilePicture");
        res.json(user.friends);
    } catch (error) {
        console.error("🚨 Error fetching friends list:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Update User Profile (Protected)
router.put("/profile", protect, upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
    { name: "portfolio", maxCount: 1 }
]), async (req, res) => {
    try {
        const { username, email, bio, socialHandles } = req.body;
        let updateData = { username, email, bio };

        if (socialHandles) {
            updateData.socialHandles = JSON.parse(socialHandles);
        }

        if (req.files?.profilePicture?.[0]) {
            updateData.profilePicture = `/uploads/${req.files.profilePicture[0].filename}`;
        }
        if (req.files?.coverPhoto?.[0]) {
            updateData.coverPhoto = `/uploads/${req.files.coverPhoto[0].filename}`;
        }
        if (req.files?.portfolio?.[0]) {
            updateData.portfolio = `/uploads/${req.files.portfolio[0].filename}`;
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        res.json(updatedUser);
    } catch (error) {
        console.error("🚨 Profile update error:", error);
        res.status(500).json({ message: "Server error" });
    }
});




module.exports = router;
