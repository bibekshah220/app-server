const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      unique: true,
      required: true,
    },
    balance: {
      type: Number,
      default: 0, // Available for withdrawal
    },
    escrowBalance: {
      type: Number,
      default: 0, // Pending clearance (orders not yet delivered)
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalCommissionPaid: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Wallet", WalletSchema);
