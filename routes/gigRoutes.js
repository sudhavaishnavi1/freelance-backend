const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Gig = require("../models/Gig");
const verifyToken = require("../middleware/verifyToken");

// 🔧 Configure multer to store uploaded images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder for uploads
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ Serve all gigs
router.get("/", async (req, res) => {
  try {
    const gigs = await Gig.find().populate("user", "username"); // Populate user name
    res.status(200).json(gigs);
  } catch (err) {
    console.error("Error fetching gigs:", err);
    res.status(500).json({ message: "Failed to fetch gigs" });
  }
});

// ✅ Create a new gig
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { title, description, price } = req.body;

    if (!title || !description || !price || !req.file) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const newGig = new Gig({
      title,
      description,
      price,
      imageUrl: `/uploads/${req.file.filename}`, // ✅ Use this for serving images
      user: req.user.userId,
    });

    await newGig.save();
    res.status(201).json({ message: "Gig created successfully", gig: newGig });
  } catch (err) {
    console.error("❌ Gig creation failed:", err);
    res.status(500).json({ message: "Gig creation failed" });
  }
});

module.exports = router;
