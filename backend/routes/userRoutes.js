const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");


// ✅ Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({ storage });


// ✅ Middleware to verify JWT Token (Use consistently)
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Access Token Required" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or Expired Token" });
        }
        req.user = user;  // Save user info for next middlewares
        next();
    });
}

// ✅ Get all users (excluding current user)
router.get("/profiles", protect, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to load users" });
  }
});



// ✅ Fetch logged-in user profile (excluding password)
router.get("/profile", protect, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("❌ Error fetching profile:", err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});







router.put(
  "/profile",
  protect,
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
    { name: "portfolio", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const userId = req.user?.userId || req.user?._id;
      const user = await User.findById(userId);

      if (!user) return res.status(404).json({ error: "User not found." });

      const { username, email, bio, socialHandles } = req.body;

      if (username) user.username = username;
      if (email) user.email = email;
      if (bio) user.bio = bio;

      if (socialHandles) {
        try {
          user.socialHandles = JSON.parse(socialHandles);
        } catch {
          return res.status(400).json({ error: "Invalid social handles format" });
        }
      }

      if (req.files?.profilePicture?.[0]) {
        user.profilePicture = `/uploads/${req.files.profilePicture[0].filename}`;
      }

      if (req.files?.coverPhoto?.[0]) {
        user.coverPhoto = `/uploads/${req.files.coverPhoto[0].filename}`;
      }

      if (req.files?.portfolio?.[0]) {
        user.portfolio = `/uploads/${req.files.portfolio[0].filename}`;
      }

      await user.save();

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });

      const updatedUser = await User.findById(user._id).select("-password");

      res.json({
        message: "Profile updated successfully",
        user: updatedUser,
        token
      });
    } catch (err) {
      console.error("❌ Error updating profile:", err.message);
      res.status(500).json({ error: "Failed to update profile." });
    }
  }
);



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

        res.json({ message: "Friend request sent!" });
    } catch (error) {
        console.error("❌ Error sending friend request:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Get Friend Requests (Received)
router.get("/friend-requests", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("friendRequests", "username email profilePicture");
        res.json(user.friendRequests);
    } catch (error) {
        console.error("❌ Error fetching friend requests:", error);
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
        console.error("❌ Error accepting friend request:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/list", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate("friends", "-password");
    res.json(user.friends);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});


// ✅ Fetch User Friends
router.get("/friends", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("friends", "username email profilePicture");
        res.json(user.friends);
    } catch (error) {
        console.error("❌ Error fetching friends list:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Update User Profile
router.put(
  "/profile",
  protect,
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
    { name: "portfolio", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized request" });

      const { username, email, bio, socialHandles } = req.body;
      const updateData = {
        ...(username && { username }),
        ...(email && { email }),
        ...(bio && { bio }),
      };

      if (socialHandles) {
        try {
          updateData.socialHandles = JSON.parse(socialHandles);
        } catch (err) {
          return res.status(400).json({ error: "Invalid JSON for social handles" });
        }
      }

      // ✅ Handle File Uploads
      if (req.files?.profilePicture?.[0]) {
        updateData.profilePicture = `/uploads/${req.files.profilePicture[0].filename}`;
      }

      if (req.files?.coverPhoto?.[0]) {
        updateData.coverPhoto = `/uploads/${req.files.coverPhoto[0].filename}`;
      }

      if (req.files?.portfolio?.[0]) {
        updateData.portfolio = `/uploads/${req.files.portfolio[0].filename}`;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

      if (!updatedUser) return res.status(404).json({ error: "User not found" });

      console.log("✅ Profile updated for:", updatedUser.email);

      res.json({
        message: "✅ Profile updated!",
        user: {
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          profilePicture: updatedUser.profilePicture,
          coverPhoto: updatedUser.coverPhoto,
          bio: updatedUser.bio,
          socialHandles: updatedUser.socialHandles,
        },
      });
    } catch (error) {
      console.error("❌ Profile update error:", error.message);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;

