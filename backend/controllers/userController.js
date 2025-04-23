const User = require("../models/User");

// ✅ GET User Profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (err) {
        console.error("❌ Error fetching profile:", err);
        res.status(500).json({ message: "Server error while fetching profile" });
    }
};

// ✅ PUT Update User Profile
const updateProfile = async (req, res) => {
    try {
        const { username, email, bio, socialHandles } = req.body;

        const updateData = {};

        if (username) updateData.username = username.trim();
        if (email) updateData.email = email.trim();
        if (bio) updateData.bio = bio.trim();

        // ✅ Parse social handles if provided
        if (socialHandles) {
            try {
                updateData.socialHandles = JSON.parse(socialHandles);
            } catch (err) {
                return res.status(400).json({ message: "Invalid JSON format in socialHandles" });
            }
        }

        // ✅ Handle file uploads
        if (req.files?.profilePicture?.[0]) {
            updateData.profilePicture = `/uploads/${req.files.profilePicture[0].filename}`;
        }
        if (req.files?.coverPhoto?.[0]) {
            updateData.coverPhoto = `/uploads/${req.files.coverPhoto[0].filename}`;
        }
        if (req.files?.portfolio?.[0]) {
            updateData.portfolio = `/uploads/${req.files.portfolio[0].filename}`;
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select("-password");

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        res.json(updatedUser);
    } catch (err) {
        console.error("❌ Profile update error:", err);
        res.status(500).json({ message: "Server error while updating profile" });
    }
};

module.exports = { getUserProfile, updateProfile };

