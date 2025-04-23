const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

module.exports = function (io, connectedUsers) {
  const router = express.Router();

  // ✅ Send Friend Request
  router.post("/send-friend-request", protect, async (req, res) => {
    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ error: "Recipient ID is required." });

    try {
      const senderId = req.user.userId;
      if (recipientId === senderId) {
        return res.status(400).json({ error: "You can't send a request to yourself." });
      }

      const existing = await FriendRequest.findOne({ senderId, recipientId });
      if (existing) {
        console.log("ℹ️ Friend request already exists.");
        return res.status(200).json({ message: "Friend request already sent." });
      }

      const newRequest = new FriendRequest({ senderId, recipientId });
      await newRequest.save();

      const recipientSocketId = connectedUsers.get(recipientId);
      if (recipientSocketId) {
        console.log(`📡 Emitting to ${recipientSocketId} (user: ${recipientId})`);
        io.to(recipientSocketId).emit("friend-request-received", {
          from: senderId,
          username: req.user.username,
        });
      }

      res.status(201).json({ message: "✅ Friend request sent!" });
    } catch (err) {
      console.error("❌ Error sending friend request:", err);
      res.status(500).json({ error: "Failed to send request. Please try again." });
    }
  });

  // ✅ Request Status
  router.get("/request-status", protect, async (req, res) => {
    try {
      const userId = req.user.userId;
      const sentRequests = await FriendRequest.find({ senderId: userId, status: "pending" })
        .populate("recipientId", "username profilePicture");
      const receivedRequests = await FriendRequest.find({ recipientId: userId, status: "pending" })
        .populate("senderId", "username profilePicture");

      res.json({ sentRequests, receivedRequests });
    } catch (error) {
      console.error("❌ Error fetching friend request statuses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ✅ Pending Friend Requests
  router.get("/pending-requests", protect, async (req, res) => {
    try {
      const pendingRequests = await FriendRequest.find({ recipientId: req.user.userId, status: "pending" })
        .populate("senderId", "username profilePicture");
      res.status(200).json(pendingRequests);
    } catch (error) {
      console.error("❌ Error fetching pending requests:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ✅ Accept Friend Request
  router.post("/accept/:requestId", protect, async (req, res) => {
    try {
      const { requestId } = req.params;
      const request = await FriendRequest.findById(requestId);
      if (!request) return res.status(404).json({ message: "Friend request not found" });

      const sender = await User.findById(request.senderId);
      const receiver = await User.findById(request.recipientId);
      if (!sender || !receiver) return res.status(404).json({ message: "User not found" });

      sender.friends.push(receiver._id);
      receiver.friends.push(sender._id);
      await sender.save();
      await receiver.save();
      await FriendRequest.findByIdAndDelete(requestId);

      res.json({ message: "Friend request accepted", friend: receiver });
    } catch (error) {
      console.error("🚨 Server error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // ✅ Reject Friend Request
  router.post("/reject-request/:requestId", protect, async (req, res) => {
    try {
      const friendRequest = await FriendRequest.findOneAndUpdate(
        { _id: req.params.requestId, recipientId: req.user.userId, status: "pending" },
        { status: "rejected" },
        { new: true }
      );
      if (!friendRequest) return res.status(404).json({ message: "Friend request not found" });
      res.json({ message: "Friend request rejected." });
    } catch (error) {
      console.error("❌ Error rejecting request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ✅ Friend List
  router.get("/list", protect, async (req, res) => {
    try {
      const userId = req.user?.userId || req.user?._id;
      if (!userId) return res.status(401).json({ error: "Unauthorized: No userId in token" });

      const user = await User.findById(userId).populate("friends", "-password");
      if (!user) return res.status(404).json({ error: "User not found" });

      res.json({ friends: user.friends });
    } catch (err) {
      console.error("❌ Error fetching friend list:", err.message);
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  });

  // ✅ Remove Friend
  router.delete("/remove/:friendId", protect, async (req, res) => {
    try {
      const { friendId } = req.params;
      const userId = req.user.userId;
      if (!userId || !friendId) return res.status(400).json({ error: "Missing user or friend ID" });

      await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
      await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

      res.json({ message: "✅ Friend removed successfully" });
    } catch (error) {
      console.error("❌ Error removing friend:", error);
      res.status(500).json({ error: "Server error while removing friend" });
    }
  });

  return router;
};

