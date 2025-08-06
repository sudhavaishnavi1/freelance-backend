// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const Gig = require("../models/gig");
const verifyToken = require("../middleware/verifyToken");
const Review = require("../models/Review");

router.post("/:gigId/reviews", verifyToken, async (req, res) => {
  try {
    const { comment, rating } = req.body;
    const gig = await Gig.findById(req.params.gigId);

    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    const review = {
      userId: req.userId,
      comment,
      rating,
    };

    gig.reviews.push(review);
    await gig.save();

    res.status(201).json({ message: "Review submitted successfully" });
  } catch (err) {
    console.error("Review error:", err);
    res.status(500).json({ message: "Failed to submit review" });
  }
});

// GET reviews by gig ID
router.get("/:gigId", async (req, res) => {
  try {
    const reviews = await Review.find({ gigId: req.params.gigId }).populate("clientId", "email");
    res.status(200).json(reviews);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});


module.exports = router;
