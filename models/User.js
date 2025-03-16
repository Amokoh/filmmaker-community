const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Include if using password authentication
  profilePhoto: { type: String, default: '' }, // URL or path to profile photo
  coverPhoto: { type: String, default: '' },   // URL or path to cover photo
  bio: { type: String, maxLength: 500 },       // Short bio
  category: {
    type: String,
    enum: ['videographer', 'artist', 'photographer'], // Category options
    required: true,
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Friend connections
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
});

// Hash password before saving
// Middleware to hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });

// Method to compare password (optional for signup but useful for login)
userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

const User = mongoose.model('User', userSchema);
module.exports = User;