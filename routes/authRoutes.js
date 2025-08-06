const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
const generateToken = require("../utils/generateToken");

// ✅ POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // 🔎 Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✨ Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role, // Must be either "client" or "freelancer"
    });

    await newUser.save();
    return res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
});

// ✅ POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔎 Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔐 Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🎫 Generate JWT
    const token = generateToken(user._id);

    // ✅ Respond with user info & token
    return res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed. Try again." });
  }
});

module.exports = router;
