const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id || decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ Attach only required user data
    req.user = {
      userId: user._id, // ⚠️ renamed from _id to userId
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
    };

    next();
  } catch (error) {
    console.error("❌ JWT Error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { protect };

