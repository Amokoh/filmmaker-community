const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { protect } = require("../middlewares/authMiddleware");
const Post = require("../models/Post");


// ✅ Upload Post Image (Authenticated)
router.post("/upload-post-image", protect, upload.single("postImage"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ message: "✅ Post image uploaded", imageUrl });
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



// ✅ Get all posts (latest first)
router.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }); // DESCENDING
    res.status(200).json(posts);
  } catch (err) {
    console.error("❌ Error fetching posts:", err.message);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});



// ✅ Create a new post (Authenticated)
router.post("/", protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Post content is required" });
    }

    console.log("📝 Creating post with content:", content);
    console.log("👤 Authenticated user:", req.user);

    const post = new Post({
      userId: req.user.userId, // ✅ Corrected field name
      username: req.user.username,
      profilePicture: req.user.profilePicture,
      content,
    });

    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error("❌ Error in create post:", err.message);
    res.status(500).json({ error: "Failed to create post." });
  }
});







// ✅ Like a Post (only once per user)
router.post("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    // Check if user already liked this post
    const alreadyLiked = post.likedBy.includes(req.user.userId);
    if (alreadyLiked) {
      return res.status(400).json({ message: "You have already liked this post." });
    }

    post.likes++;
    post.likedBy.push(req.user.userId); // Track user who liked it
    await post.save();

    res.json(post);
  } catch (err) {
    console.error("❌ Error liking post:", err.message);
    res.status(500).json({ error: "Failed to like post." });
  }
});


// ✅ Comment on a Post (Authenticated)
router.post("/:id/comment", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text is required." });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const newComment = {
      userId: req.user._id,
      username: req.user.username,
      profilePicture: req.user.profilePicture,
      text,
      replies: []
    };

    post.comments.push(newComment);
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to comment on post." });
  }
});

// ✅ Reply to Comment (Authenticated)
router.post("/:id/comment/:commentId/reply", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Reply text is required." });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found." });

    comment.replies.push({
      userId: req.user._id,
      username: req.user.username,
      profilePicture: req.user.profilePicture,
      text
    });

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to reply to comment." });
  }
});

module.exports = router;

