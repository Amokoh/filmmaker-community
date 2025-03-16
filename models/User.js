const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        profilePicture: { type: String, default: "/uploads/default.png" },
        coverPhoto: { type: String, default: "" },
        bio: { type: String, default: "" },
        socialHandles: { type: Object, default: {} },

        // ✅ Friend System
        friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Confirmed Friends
        friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Incoming Requests
        sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ✅ Track Sent Requests
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
