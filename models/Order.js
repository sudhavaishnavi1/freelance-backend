const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  gigId: { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  price: { type: Number, required: true },
  delivered: { type: Boolean, default: false },
  deliveryFile: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
