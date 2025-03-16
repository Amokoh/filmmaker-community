// routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to get user profile
router.get('/profile', authMiddleware, userController.getProfile);

// Route to update user profile
router.patch('/updateProfile', authMiddleware, userController.updateProfile);

module.exports = router;