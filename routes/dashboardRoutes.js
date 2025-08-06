const express = require("express");
const router = express.Router();
const Gig = require("../models/gig");
const Order = require("../models/Order");
const verifyToken = require("../middleware/verifyToken");

router.get("/freelancer", verifyToken, async (req, res) => {
  try {
    const gigs = await Gig.find({ createdBy: req.userId });

    const gigIds = gigs.map((gig) => gig._id);

    const orders = await Order.find({ gigId: { $in: gigIds } }).populate("gigId clientId");

    const totalEarnings = orders.reduce((sum, order) => sum + order.price, 0);

    res.status(200).json({ gigs, orders, totalEarnings });
  } catch (err) {
    console.error("Freelancer dashboard error:", err);
    res.status(500).json({ message: "Failed to load freelancer dashboard" });
  }
});

module.exports = router;
