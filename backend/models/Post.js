const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Post Schema
const PostSchema = new mongoose.Schema({
    username: String,
    profilePicture: String,
    content: String,
    likes: { type: Number, default: 0 },
    comments: [
        {
            username: String,
            profilePicture: String,
            text: String,
            replies: [
                { username: String, profilePicture: String, text: String }
            ]
        }
    ],
    timestamp: { type: Date, default: Date.now }
});

const Post = mongoose.model("Post", PostSchema);

// ✅ Get all posts
router.get("/posts", async (req, res) => {
    const posts = await Post.find().sort({ timestamp: -1 });
    res.json(posts);
});

// ✅ Create a new post (Authenticated Users Only)
router.post("/posts", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const newPost = new Post({
        username: req.user.username,
        profilePicture: req.user.profilePicture,
        content: req.body.content
    });

    await newPost.save();
    res.json(newPost);
});

// ✅ Like a post
router.post("/posts/:id/like", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const post = await Post.findById(req.params.id);
    if (post) {
        post.likes += 1;
        await post.save();
        res.json(post);
    }
});

// ✅ Add a comment
router.post("/posts/:id/comment", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const post = await Post.findById(req.params.id);
    if (post) {
        const newComment = {
            username: req.user.username,
            profilePicture: req.user.profilePicture,
            text: req.body.text,
            replies: []
        };
        post.comments.push(newComment);
        await post.save();
        res.json(post);
    }
});

// ✅ Reply to a comment
router.post("/posts/:id/comment/:commentId/reply", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const post = await Post.findById(req.params.id);
    if (post) {
        const comment = post.comments.id(req.params.commentId);
        if (comment) {
            comment.replies.push({
                username: req.user.username,
                profilePicture: req.user.profilePicture,
                text: req.body.text
            });
            await post.save();
            res.json(post);
        }
    }
});

module.exports = router;