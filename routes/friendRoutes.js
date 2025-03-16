const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

// ✅ Send Friend Request
router.post("/send-friend-request", protect, async (req, res) => {
    try {
        const { recipientId } = req.body;
        const senderId = req.user.id;

        if (!recipientId) {
            return res.status(400).json({ message: "Recipient ID is required." });
        }

        const sender = await User.findById(senderId);
        const recipient = await User.findById(recipientId);

        if (!sender || !recipient) {
            return res.status(404).json({ message: "User not found." });
        }

        const existingRequest = await FriendRequest.findOne({
            senderId,
            recipientId,
            status: "pending",
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Friend request already sent." });
        }

        const alreadyFriends = sender.friends.includes(recipientId);

        if (alreadyFriends) {
            return res.status(400).json({ message: "You are already friends." });
        }

        // ✅ Create a new friend request
        await FriendRequest.create({
            senderId,
            recipientId,
            status: "pending",
        });

        res.status(200).json({ message: "Friend request sent successfully!" });

    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ✅ Fetch Sent & Received Friend Requests
router.get("/request-status", protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const sentRequests = await FriendRequest.find({ senderId: userId, status: "pending" }).populate("recipientId", "username profilePicture");
        const receivedRequests = await FriendRequest.find({ recipientId: userId, status: "pending" }).populate("senderId", "username profilePicture");

        res.json({ sentRequests, receivedRequests });
    } catch (error) {
        console.error("❌ Error fetching friend request statuses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Fetch Pending Friend Requests for the Logged-in User
router.get("/pending-requests", protect, async (req, res) => {
    try {
        const pendingRequests = await FriendRequest.find({ recipientId: req.user.id, status: "pending" })
            .populate("senderId", "username profilePicture");

        res.status(200).json(pendingRequests);
    } catch (error) {
        console.error("❌ Error fetching pending requests:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Accept Friend Request
router.post("/accept-request/:requestId", protect, async (req, res) => {
    try {
        const friendRequest = await FriendRequest.findOneAndUpdate(
            { _id: req.params.requestId, recipientId: req.user.id, status: "pending" },
            { status: "accepted" },
            { new: true }
        );

        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        // ✅ Add users to each other's friends list
        await User.findByIdAndUpdate(friendRequest.senderId, {
            $push: { friends: friendRequest.recipientId }
        });

        await User.findByIdAndUpdate(friendRequest.recipientId, {
            $push: { friends: friendRequest.senderId }
        });

        res.status(200).json({ message: "Friend request accepted!" });

    } catch (error) {
        console.error("❌ Error accepting request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Reject Friend Request
router.post("/reject-request/:requestId", protect, async (req, res) => {
    try {
        const friendRequest = await FriendRequest.findOneAndUpdate(
            { _id: req.params.requestId, recipientId: req.user.id, status: "pending" },
            { status: "rejected" },
            { new: true }
        );

        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        res.json({ message: "Friend request rejected." });

    } catch (error) {
        console.error("❌ Error rejecting request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
