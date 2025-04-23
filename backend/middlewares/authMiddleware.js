const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Middleware to protect routes and attach full user data
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("❌ Missing or malformed auth header");
    return res.status(401).json({ message: "Not authorized: Token missing or malformed" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ JWT decoded:", decoded);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.warn("❌ User not found for ID:", decoded.userId);
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ Unified format: always include userId
    req.user = {
      userId: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
    };

    next();
  } catch (error) {
    console.error("❌ JWT verification failed:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ✅ Lightweight version (if needed separately)
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    console.error("❌ JWT decode failed:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { protect, authenticateUser };

