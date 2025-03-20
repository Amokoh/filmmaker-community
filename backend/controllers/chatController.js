// controllers/chatController.js
const ChatMessage = require('../models/ChatMessage'); // Assuming you have a ChatMessage model

exports.sendMessage = async (req, res) => {
  const { message, userId } = req.body;

  try {
    // Save the message to the database
    const chatMessage = new ChatMessage({ message, userId });
    await chatMessage.save();

    // Emit the message using Socket.io
    req.io.emit('chat message', chatMessage); // Use req.io to access the Socket.io instance

    res.status(200).json({ message: 'Message sent', chatMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};