const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");


// ✅ Send Friend Request
router.post("/send-friend-request", protect, async (req, res) => {
    try {
        console.log("📥 Received Friend Request:", req.body); // ✅ Debug Log

        const { recipientId } = req.body;
        const senderId = req.user.id;

        if (!recipientId) {
            console.error("❌ Error: Recipient ID missing in request body.");
            return res.status(400).json({ message: "Recipient ID is required." });
        }

        console.log(`👤 Sender: ${senderId} ➡️ Recipient: ${recipientId}`);
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
        const newRequest = await FriendRequest.create({
            senderId,
            recipientId,
            status: "pending",
        });

        console.log("✅ Friend request sent:", newRequest);

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
router.post("/accept/:requestId", async (req, res) => {
    try {
        const { requestId } = req.params;
        console.log("📥 Accepting friend request for ID:", requestId);

        const request = await FriendRequest.findById(requestId);
        if (!request) {
            console.log("❌ Friend request not found");
            return res.status(404).json({ message: "Friend request not found" });
        }

        console.log("✅ Found request:", request);

        const sender = await User.findById(request.senderId);
        const receiver = await User.findById(request.recipientId);

        console.log("👤 Sender:", sender ? sender._id : "❌ Not Found");
        console.log("👤 Receiver:", receiver ? receiver._id : "❌ Not Found");

        if (!sender) {
            return res.status(404).json({ message: "Sender user not found" });
        }
        if (!receiver) {
            return res.status(404).json({ message: "Receiver user not found" });
        }

        sender.friends.push(receiver._id);
        receiver.friends.push(sender._id);

        await sender.save();
        await receiver.save();

        await FriendRequest.findByIdAndDelete(requestId);

        return res.json({ message: "Friend request accepted", friend: receiver });

    } catch (error) {
        console.error("🚨 Server error:", error);
        res.status(500).json({ message: "Internal Server Error" });
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

// ✅ Get the list of friends
router.get("/list", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("friends", "username profilePicture");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user.friends);
    } catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Corrected: Use `router.delete()` instead of `app.delete()`
router.delete("/remove/:friendId", protect, async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.id;

        console.log(`Removing friend ${friendId} for user ${userId}`);

        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        if (!friendId) return res.status(400).json({ error: "Friend ID is required" });

        await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

        res.json({ message: "✅ Friend removed successfully" });
    } catch (error) {
        console.error("Error removing friend:", error);
        res.status(500).json({ error: "Server error while removing friend" });
    }
});




module.exports = router;
