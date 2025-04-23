const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User"); // adjust path if needed

dotenv.config();

const mongoURI = process.env.MONGO_URI;

const seedUser = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    const existing = await User.findOne({ email: "test@example.com" });
    if (existing) {
      console.log("⚠️ User already exists. Deleting and recreating...");
      await User.deleteOne({ email: "test@example.com" });
    }

    const hashedPassword = await bcrypt.hash("Test@1234", 10);
    const newUser = new User({
      username: "testuser",
      email: "test@example.com",
      password: hashedPassword,
      profilePicture: "/uploads/default.png"
    });

    await newUser.save();
    console.log("✅ Test user created successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding test user:", err);
    process.exit(1);
  }
};

seedUser();
