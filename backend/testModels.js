const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Post = require('./models/Post');
const Notification = require('./models/Notification');
const Message = require('./models/Message');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

async function testModels() {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'john@example.com' });
    
    let user;
    if (existingUser) {
      console.log("User with this email already exists:", existingUser);
      user = existingUser; // Use existing user
    } else {
      user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123', // In a real application, hash this password!
        bio: 'Videographer based in NYC',
        category: 'videographer',
      });
      await user.save();
      console.log('User saved:', user);
    }

    const post = new Post({
      user: user._id,
      content: 'My first post!',
      media: '',
    });
    await post.save();
    console.log('Post saved:', post);

    const notification = new Notification({
      user: user._id,
      sender: user._id,
      type: 'friend_request',
      message: 'John sent you a friend request.',
    });
    await notification.save();
    console.log('Notification saved:', notification);

    const message = new Message({
      sender: user._id,
      recipient: user._id,
      message: 'Hello, this is a test message.',
    });
    await message.save();
    console.log('Message saved:', message);

  } catch (error) {
    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      console.error("A user with this email already exists.");
    } else {
      console.error('Error saving test data:', error);
    }
  } finally {
    mongoose.connection.close();
  }
}

testModels();