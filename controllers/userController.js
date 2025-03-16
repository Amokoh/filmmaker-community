// controllers/userController.js
const User = require('../models/User');



// controllers/userController.js
exports.getProfile = (req, res) => {
  // Your logic here for fetching a profile
  res.send("User profile data"); // Example response
};

exports.updateProfile = async (req, res) => {
  const { userId } = req.user; // Assuming you have userId in req.user after authentication
  const { bio, profilePhoto, coverPhoto } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { bio, profilePhoto, coverPhoto },
      { new: true }
    );
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Friend request handling
exports.sendFriendRequest = async (req, res) => {
  const { userId } = req.user; // User sending the request
  const { friendId } = req.body; // User to add as a friend

  try {
    const user = await User.findById(userId);
    user.friends.push(friendId); // Assuming friends is an array in your User model
    await user.save();
    res.json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};