const mongoose = require("mongoose");

// Define Reply Schema (embedded in Comments)
const ReplySchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  username: String,
  profilePicture: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});

// Define Comment Schema (embedded in Posts)
const CommentSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  username: String,
  profilePicture: String,
  text: String,
  replies: [ReplySchema],
  createdAt: { type: Date, default: Date.now }
});

// Define Post Schema with timestamps enabled
const PostSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    profilePicture: String,
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [CommentSchema]
    // No need for timestamp field here — we'll use createdAt
  },
  { timestamps: true } // ✅ Automatically adds createdAt and updatedAt
);

module.exports = mongoose.model("Post", PostSchema);

