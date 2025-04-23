const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');

// ✅ Generate JWT Helper
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ✅ SIGNUP
exports.signup = async (req, res) => {
  const { email, password, username } = req.body;

  try {
    // Check for existing email
    const existingUser = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (existingUser) {
      return res.status(400).json({ message: "⚠️ User with this email already exists." });
    }

    // Optionally: check username uniqueness if required
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: "⚠️ Username is already taken." });
      }
    }

    // Hash password if model doesn't auto-hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save user
    const user = new User({ email, username, password: hashedPassword });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: "✅ Signup successful!",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).json({ message: "⚠️ Internal server error" });
  }
};

// ✅ LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user) {
      return res.status(401).json({ message: '❌ Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '❌ Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: '✅ Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: '⚠️ Internal server error' });
  }
};

// ✅ Google OAuth Start
exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

// ✅ Google OAuth Callback
exports.googleCallback = (req, res) => {
  if (!req.user) {
    return res.redirect('/auth.html?error=google_auth_failed');
  }

  const token = generateToken(req.user._id);
  res.redirect(`/profile.html?token=${token}`);
};

