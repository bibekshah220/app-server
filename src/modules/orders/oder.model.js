const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        image: String,
      },
    ],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentInfo: {
      id: String,
      status: { type: String, default: "pending" }, // pending, paid, failed, refunded
      method: {
        type: String,
        enum: ["cod", "esewa", "khalti"],
        default: "cod",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "shipped",
        "delivered",
        "completed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    deliveredAt: Date,
    shippedAt: Date,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", OrderSchema);
