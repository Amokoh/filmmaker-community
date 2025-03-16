const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    media: { type: String, default: '' }, // URL or path to an image/video file
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who liked the post
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    timestamp: { type: Date, default: Date.now },
  });
  
  module.exports = mongoose.model('Post', postSchema);