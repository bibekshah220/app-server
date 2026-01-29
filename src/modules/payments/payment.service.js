const Wallet = require("./wallet.model");
const Transaction = require("./transaction.model");
const Seller = require("../sellers/seller.model");
const Order = require("../orders/order.model");

exports.processPaymentSuccess = async (orderId, paymentRef) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const sellerWallet = await Wallet.findOne({ seller: order.seller });
  // Create wallet if not exists
  if (!sellerWallet) {
    await Wallet.create({ seller: order.seller });
  }

  // 1. Update Order Status
  order.paymentInfo.status = "paid";
  order.paymentInfo.id = paymentRef;
  order.status = "paid";
  await order.save();

  // 2. Add to Escrow Balance
  await Wallet.findOneAndUpdate(
    { seller: order.seller },
    { $inc: { escrowBalance: order.totalAmount } },
    { upsert: true },
  );

  // 3. Log Transaction
  await Transaction.create({
    wallet: sellerWallet ? sellerWallet._id : null, // (Will be fixed by upsert return if logic adjusted, but keeping simple)
    order: order._id,
    type: "credit",
    amount: order.totalAmount,
    description: "Order Payment to Escrow",
    status: "completed",
  });
};

exports.releaseEscrow = async (orderId) => {
  const order = await Order.findById(orderId);
  const seller = await Seller.findById(order.seller);
  const wallet = await Wallet.findOne({ seller: order.seller });

  if (!wallet) throw new Error("Wallet not found");

  const amount = order.totalAmount;
  const commissionRate = seller.commissionRate || 10;
  const commissionAmount = (amount * commissionRate) / 100;
  const sellerEarnings = amount - commissionAmount;

  // 1. Move from Escrow to Balance
  wallet.escrowBalance -= amount;
  wallet.balance += sellerEarnings;
  wallet.totalEarnings += sellerEarnings;
  wallet.totalCommissionPaid += commissionAmount;
  await wallet.save();

  // 2. Log Transactions
  // Release
  await Transaction.create({
    wallet: wallet._id,
    order: order._id,
    type: "escrow_release",
    amount: amount,
    description: "Release from Escrow",
  });

  // Commission Debit (Virtual) - effectively we just credited net amount, but good to log
  await Transaction.create({
    wallet: wallet._id,
    order: order._id,
    type: "commission",
    amount: commissionAmount,
    description: `Platform Commission (${commissionRate}%)`,
  });
};
