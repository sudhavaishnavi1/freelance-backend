const Order = require("../models/Order");

const createOrder = async (req, res) => {
  try {
    const newOrder = new Order({
      gig: req.body.gigId,
      buyer: req.userId, // coming from verifyToken middleware
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("❌ Error placing order:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.userId }).populate("gig");
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { createOrder, getUserOrders };
