const express = require("express");
const Post = require("../models/Post");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Setup image upload
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Create a new post
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { userId, username, profilePicture, content } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";
    const newPost = new Post({ userId, username, profilePicture, content, image });
    await newPost.save();

    // Emit event for real-time updates
    req.io.emit("newPost", newPost);

    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ timestamp: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like a post
router.put("/:postId/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
    } else {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    }

    await post.save();
    req.io.emit("postLiked", post);

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a comment
router.post("/:postId/comment", async (req, res) => {
  try {
    const { userId, username, text } = req.body;
    const post = await Post.findById(req.params.postId);

    post.comments.push({ userId, username, text });
    await post.save();

    req.io.emit("newComment", { postId: post._id, comment: { userId, username, text } });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
