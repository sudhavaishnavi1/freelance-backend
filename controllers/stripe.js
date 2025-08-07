const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Gig = require("../models/gig");

const createCheckoutSession = async (req, res) => {
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
            unit_amount: parseInt(gig.price) * 100, // Convert ₹ to paise
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://freelance-frontend-chi.vercel.app/success",
      cancel_url: "https://freelance-frontend-chi.vercel.app/cancel",
    });

    // ✅ Send session.url to frontend for redirection
    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error("❌ Stripe Checkout Error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

module.exports = { createCheckoutSession };
