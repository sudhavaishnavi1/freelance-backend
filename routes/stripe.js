const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
console.log("Stripe Key:", process.env.STRIPE_SECRET_KEY);

const Gig = require("../models/gig");
const verifyToken = require("../middleware/verifyToken");

router.post("/create-checkout-session", verifyToken, async (req, res) => {
  try {
    const gig = await Gig.findById(req.body.gigId);
    if (!gig) {
      return res.status(404).json({ error: "Gig not found" });
    }

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
            unit_amount: parseInt(gig.price) * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

module.exports = router;

