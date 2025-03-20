const jwt = require("jsonwebtoken");
const User = require("../models/User"); // ✅ Corrected path
const { protect } = require("../middlewares/authMiddleware");

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1]; // Extract token

            if (!token) {
                return res.status(401).json({ message: "Not authorized, token missing" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
            req.user = await User.findById(decoded.id).select("-password"); // Get user data

            if (!req.user) {
                return res.status(401).json({ message: "User not found, invalid token" });
            }

            next();
        } catch (error) {
            console.error("❌ JWT Verification Error:", error);
            res.status(401).json({ message: "Not authorized, invalid token" });
        }
    } else {
        res.status(401).json({ message: "Not authorized, no token provided" });
    }
};

module.exports = { protect };
