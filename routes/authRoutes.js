const express = require('express');
const authController = require('../controllers/authController'); // Import the authController
const router = express.Router();

// User authentication routes
router.post('/signup', authController.signup); // This handles POST requests to /auth/signup
router.post('/login', authController.login); // For login

// Google Auth routes
router.get('/google', authController.googleAuth); // Adjusted to remove 'auth' prefix
router.get('/google/callback', authController.googleCallback); // Adjusted to remove 'auth' prefix


// Sign up form route
router.get('/signup', (req, res) => {
  res.send('Sign up form'); // Replace with your actual login form rendering logic
}); 
// Login form route
router.get('/login', (req, res) => {
  res.send('Login form'); // Replace with your actual login form rendering logic
});

module.exports = router;