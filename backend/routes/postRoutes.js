const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload"); // ✅ Ensure this line is present

// Route for uploading post images
router.post("/upload-post-image", upload.single("postImage"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        res.status(200).json({ message: "Post image uploaded successfully", filePath: req.file.path });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
