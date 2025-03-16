const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware'); // If you want to protect the route

const router = express.Router();

// Send a chat message
router.post('/send', authMiddleware, chatController.sendMessage);

module.exports = router;