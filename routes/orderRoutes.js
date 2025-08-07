const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Gig = require("../models/gig");
const verifyToken = require("../middleware/verifyToken");
const multer = require("multer");
const path = require("path");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const upload = multer({ dest: "uploads/" }); // File upload destination

// Route to mark order as delivered
router.put("/deliver/:orderId", verifyToken, upload.single("deliveryFile"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.delivered = true;
    if (req.file) {
      order.deliveryFile = req.file.filename;
    }

    await order.save();
    res.status(200).json({ message: "Order marked as delivered" });
  } catch (err) {
    console.error("Error delivering order:", err);
    res.status(500).json({ message: "Failed to deliver order" });
  }
});

// Get orders for the logged-in client
router.get("/my-orders", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ clientId: req.userId }).populate("gigId");
    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching client orders:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Get orders received by the freelancer
router.get("/freelancer-orders", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find()
      .populate({
        path: "gigId",
        populate: { path: "user" },
      })
      .populate("clientId");

    const freelancerOrders = orders.filter(
      (order) => order.gigId?.user?._id?.toString() === userId
    );

    res.status(200).json(freelancerOrders);
  } catch (err) {
    console.error("Error fetching freelancer orders:", err);
    res.status(500).json({ message: "Failed to fetch freelancer orders" });
  }
});

// Serve delivery file
router.get("/delivery/:orderId", verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order || !order.deliveryFile) {
      return res.status(404).json({ message: "File not found" });
    }

    const filePath = path.join(__dirname, "../uploads", order.deliveryFile);
    res.sendFile(filePath);
  } catch (err) {
    console.error("Error fetching file:", err);
    res.status(500).json({ message: "Error retrieving file" });
  }
});

// Get freelancer total earnings
router.get("/freelancer/earnings", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ freelancerId: req.userId }).populate("gigId");
    const totalEarnings = orders.reduce((acc, order) => acc + (order.gigId?.price || 0), 0);
    res.status(200).json({ totalEarnings });
  } catch (err) {
    console.error("Error calculating earnings:", err);
    res.status(500).json({ message: "Failed to calculate earnings" });
  }
});

// Legacy route (optional)
router.get("/client", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.userId })
    .populate("gigId")
    .populate("freelancerId");
    res.json(orders);
  } catch (err) {
    console.error("Error loading client orders:", err);
    res.status(500).json({ message: "Failed to load client orders" });
  }
});

// Place order directly (without Stripe)
router.post("/place", verifyToken, async (req, res) => {
  try {
    const { gigId } = req.body;

    if (!gigId) {
      return res.status(400).json({ message: "Gig ID is required" });
    }

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    const newOrder = new Order({
      gigId: gig._id,
      freelancerId: gig.user,
      clientId: req.user.userId,
      price: gig.price,
    });

    await newOrder.save();
    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (err) {
    console.error("Order placement error:", err);
    res.status(500).json({ message: "Failed to place order" });
  }
});

// Stripe payment session
router.post("/create-checkout-session", verifyToken, async (req, res) => {
  try {
    const { gigId } = req.body;
    const gig = await Gig.findById(gigId);
    if (!gig) return res.status(404).json({ message: "Gig not found" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: gig.title,
              description: gig.description,
            },
            unit_amount: gig.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://freelance-frontend-chi.vercel.app/success",
      cancel_url: "https://freelance-frontend-chi.vercel.app/cancel",
      metadata: {
        gigId: gig._id.toString(),
        freelancerId: gig.user.toString(),
        clientId: req.user.id,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe session error:", error);
    res.status(500).json({ message: "Stripe session creation failed" });
  }
});

// DELETE orphan orders (where gigId is missing or deleted)
router.delete("/cleanup-orphan-orders", async (req, res) => {
  try {
    const orders = await Order.find().populate("gigId");

    const orphanOrders = orders.filter(order => !order.gigId);

    const deletePromises = orphanOrders.map(order => Order.findByIdAndDelete(order._id));

    await Promise.all(deletePromises);

    res.status(200).json({ message: `${orphanOrders.length} orphan orders deleted` });
  } catch (error) {
    console.error("Error cleaning up orphan orders:", error);
    res.status(500).json({ message: "Failed to delete orphan orders" });
  }
});

module.exports = router;
