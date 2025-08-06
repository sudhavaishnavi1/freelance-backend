const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Gig = require("../models/gig");
const Review = require("../models/Review");

// GET admin dashboard data
router.get("/dashboard", async (req, res) => {
  try {
    const users = await User.find({}, "name email role");
    const gigs = await Gig.find({}, "title price");
    const reviews = await Review.find({}, "rating comment");

    res.json({
      users,
      gigs,
      reviews,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ error: "Failed to fetch admin dashboard data" });
  }
});

module.exports = router;
