const User = require("../models/User");

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password"); // Exclude password
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (err) {
        console.error("Error fetching profile:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { username, email, bio, socialHandles } = req.body;
        let updateData = { username, email, bio };

        if (socialHandles) {
            updateData.socialHandles = JSON.parse(socialHandles);
        }

        if (req.files?.profilePicture) {
            updateData.profilePicture = `/uploads/${req.files.profilePicture[0].filename}`;
        }
        if (req.files?.coverPhoto) {
            updateData.coverPhoto = `/uploads/${req.files.coverPhoto[0].filename}`;
        }
        if (req.files?.portfolio) {
            updateData.portfolio = `/uploads/${req.files.portfolio[0].filename}`;
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        res.json(updatedUser);
    } catch (err) {
        console.error("Profile update error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getUserProfile, updateProfile };