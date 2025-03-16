const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Recipient
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },               // User who triggered the notification
    type: { type: String, enum: ['friend_request', 'like', 'comment', 'message'], required: true },
    message: { type: String },
    status: { type: String, enum: ['unread', 'read'], default: 'unread' },
    timestamp: { type: Date, default: Date.now },
  });
  
  module.exports = mongoose.model('Notification', notificationSchema);