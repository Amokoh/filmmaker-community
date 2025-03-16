const express = require("express");
const GroupMessage = require("../models/groupMessage");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Group Chat API is working!");
});


// Save a new group message
router.post("/", async (req, res) => {
  try {
    const { senderId, groupId, message } = req.body;
    const newMessage = new GroupMessage({ senderId, groupId, message });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages from a group
router.get("/:groupId", async (req, res) => {
  try {
    const messages = await GroupMessage.find({ groupId: req.params.groupId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
