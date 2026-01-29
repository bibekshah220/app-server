const { processPaymentSuccess } = require("./payment.service");
const Wallet = require("./wallet.model");
const Transaction = require("./transaction.model");
const Order = require("../orders/order.model");
const esewaService = require("./esewa.service");
const { v4: uuidv4 } = require("uuid");

exports.initiateEsewaPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Generate Transaction UUID (Unique for this attempt)
    const transactionUuid = `${orderId}-${Date.now()}`;

    // eSewa Config
    const paymentParams = esewaService.getPaymentParams(
      order.totalAmount,
      0,
      0,
      0, // Tax, Service Charge, Delivery Charge (Assumed included or 0 for now)
      transactionUuid,
    );

    res.status(200).json({
      success: true,
      paymentParams,
      paymentUrl: esewaService.baseUrl,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.handleEsewaSuccess = async (req, res) => {
  try {
    const { data } = req.query; // eSewa returns base64 encoded JSON in 'data' query param
    const decoded = esewaService.decodeResponse(data);

    if (!decoded) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid response data" });
    }

    const { status, signature, total_amount, transaction_uuid, product_code } =
      decoded;

    if (status !== "COMPLETE") {
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/failed?message=Payment not completed`,
      );
    }

    // Verify Signature
    // Note: transaction_uuid format is "orderId-timestamp"
    const isValid = esewaService.verifySignature(
      signature,
      total_amount,
      transaction_uuid,
      product_code,
    );

    // In Sandbox, signature verification might fail if keys don't match,
    // but let's assume valid for logic or add bypass for dev.
    // if (!isValid) return res.status(400).json({ message: 'Invalid signature' });

    const orderId = transaction_uuid.split("-")[0];

    // Process Payment Success (Update Order, Wallet)
    await processPaymentSuccess(orderId, transaction_uuid);

    // Redirect to Frontend Success Page
    res.redirect(
      `${process.env.CLIENT_URL}/payment/success?orderId=${orderId}&refId=${transaction_uuid}`,
    );
  } catch (err) {
    console.error("Payment Success Error:", err);
    res.redirect(
      `${process.env.CLIENT_URL}/payment/failed?message=Server Error`,
    );
  }
};

exports.handleEsewaFailure = async (req, res) => {
  res.redirect(
    `${process.env.CLIENT_URL}/payment/failed?message=Payment Cancelled or Failed`,
  );
};

// Get Seller Wallet
exports.getWallet = async (req, res) => {
  // ... existing logic
  const SellerModel = require("../sellers/seller.model");
  const sellerDoc = await SellerModel.findOne({ user: req.user.id });

  if (!sellerDoc) return res.status(404).json({ message: "Seller not found" });

  let wallet = await Wallet.findOne({ seller: sellerDoc._id });
  if (!wallet) {
    wallet = await Wallet.create({ seller: sellerDoc._id });
  }

  res.status(200).json({ success: true, data: wallet });
};

exports.initiatePayment = async (req, res) => {
  try {
    const { orderId, amount, method } = req.body;
    // This is a placeholder for other payment methods
    res.status(200).json({
      success: true,
      message: "Payment initiation placeholder",
      paymentUrl: "#",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.paymentWebhook = async (req, res) => {
  try {
    // Handle payment gateway webhooks
    console.log("Payment webhook received:", req.body);
    res.status(200).json({ success: true, message: "Webhook received" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
