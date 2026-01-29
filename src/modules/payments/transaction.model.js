const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    type: {
      type: String,
      enum: [
        "credit",
        "debit",
        "escrow_release",
        "commission",
        "withdrawal",
        "refund",
        "payment",
      ],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["esewa", "khalti", "cod", "wallet"],
      default: "esewa",
    },
    gatewayTransactionId: { type: String }, // eSewa refId
    rawResponse: { type: Object }, // Store full gateway response for audit
    amount: {
      type: Number,
      required: true,
    },
    description: String,
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    paymentGatewayRef: String, // For withdrawals or deposits
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Transaction", TransactionSchema);
