const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middlewares/authMiddleware");
const transporter = require("../mailer");
const router = express.Router();
const crypto = require("crypto");
require("dotenv").config();

// ✅ Debug Route
router.get("/", (req, res) => {
  res.json({ message: "✅ Auth API is working correctly!" });
});

// ✅ Signup
router.post(
  "/signup",
  [
    check("username", "Username is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be strong").matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
    ),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { username, email, password } = req.body;
      const normalizedEmail = email.toLowerCase();

      if (await User.findOne({ email: normalizedEmail }))
        return res.status(400).json({ error: "⚠️ Email already in use." });

      if (await User.findOne({ username }))
        return res.status(400).json({ error: "⚠️ Username already taken." });

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        username,
        email: normalizedEmail,
        password,
        profilePicture: "/uploads/default.png",
      });

      await newUser.save();

      const token = jwt.sign(
        { userId: newUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.status(201).json({
        message: "✅ Signup successful!",
        token,
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      });
    } catch (err) {
      console.error("❌ Signup error:", err.message);
      res
        .status(500)
        .json({ error: "⚠️ Server error. Please try again later." });
    }
  }
);


// ✅ Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res
      .status(400)
      .json({ error: "⚠️ Email and password are required." });

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user)
      return res
        .status(400)
        .json({ error: "❌ No user found with this email." });

    console.log("Entered password:", password);
    console.log("Stored hash:", user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch)
      return res.status(400).json({ error: "❌ Incorrect password." });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      message: "✅ Login successful!",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res
      .status(500)
      .json({ error: "⚠️ Server error. Please try again later." });
  }
});



   
// ✅ Get Authenticated User Profile
router.get("/profile", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ error: "⚠️ User not found." });
        }
        res.json(user);
    } catch (err) {
        console.error("❌ Profile fetch error:", err.message);
        res.status(500).json({ error: "⚠️ Server error. Please try again later." });
    }
});

// ✅ Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        console.log("📩 Forgot password request for:", email);

        const user = await User.findOne({ email });
        if (!user) {
            console.log("❌ No user found with this email.");
            return res.status(404).send({ message: 'No account with that email found.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        console.log("✅ Reset token generated:", resetToken);

        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    resetPasswordToken: resetToken,
                    resetPasswordExpires: Date.now() + 3600000 // 1 hour from now
                }
            }
        );

        const resetURL = `https://storysharestudio.com/reset-password.html?token=${resetToken}`;
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <div>
                    <h2>Password Reset Request</h2>
                    <p>Hello ${user.username || user.email},</p>
                    <p>Click the link below to reset your password:</p>
                    <a href="${resetURL}">${resetURL}</a>
                    <p><strong>Note:</strong> This link will expire in one hour.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log("📨 Reset email sent to:", user.email);

        res.status(200).send({ message: 'Password reset email sent successfully!' });
    } catch (error) {
        console.error('❌ Error in /forgot-password:', error);
        res.status(500).send({ message: 'Something went wrong', error });
    }
});

// ✅ Reset Password Route
router.post("/reset-password/:token", async (req, res) => {
    try {
        const { password } = req.body;
        const { token } = req.params;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: "Password reset successful. Please log in." });
    } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ error: "Something went wrong." });
    }
});

module.exports = router;

