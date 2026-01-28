const User = require("../auth/user.model");
const Seller = require("../sellers/seller.model");
const Product = require("../products/product.model");
const Order = require("../orders/order.model");
const Wallet = require("../payments/wallet.model");
const Transaction = require("../payments/transaction.model");
const logger = require("../../config/logger");

exports.getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort("-createdAt");

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // If seller, include seller profile
    let sellerProfile = null;
    if (user.role === "seller") {
      sellerProfile = await Seller.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      data: { user, sellerProfile },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { role, isVerified } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, isVerified },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getAllSellers = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = {};
    if (status) query.status = status;

    const sellers = await Seller.find(query)
      .populate("user", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort("-createdAt");

    const total = await Seller.countDocuments(query);

    res.status(200).json({
      success: true,
      count: sellers.length,
      total,
      data: sellers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateSellerStatus = async (req, res) => {
  try {
    const { status, commissionRate } = req.body;

    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    if (status) seller.status = status;
    if (commissionRate !== undefined) seller.commissionRate = commissionRate;

    await seller.save();

    // Update user role if verified
    if (status === "verified") {
      await User.findByIdAndUpdate(seller.user, { role: "seller" });
    }

    res.status(200).json({ success: true, data: seller });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.verifySellerKyc = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    seller.kyc.verificationStatus = status;

    if (status === "verified") {
      seller.kyc.verifiedAt = Date.now();
      seller.kyc.verifiedBy = req.user.id;
      seller.status = "verified";

      // Promote user to seller role
      await User.findByIdAndUpdate(seller.user, { role: "seller" });
    } else if (status === "rejected") {
      seller.kyc.rejectionReason = rejectionReason;
      seller.status = "pending"; // Revert to pending
    }

    await seller.save();

    res.status(200).json({ success: true, data: seller });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { isActive, category, page = 1, limit = 20 } = req.query;

    let query = { isDeleted: false };
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (category) query.category = category;

    const products = await Product.find(query)
      .populate("seller", "businessName")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort("-createdAt");

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      data: products,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.toggleProductVisibility = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      success: true,
      data: product,
      message: `Product ${product.isActive ? "activated" : "deactivated"}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate("user", "name email")
      .populate("seller", "businessName")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort("-createdAt");

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      data: orders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getFinancialStats = async (req, res) => {
  try {
    // Total Platform Volume
    const volumeStats = await Order.aggregate([
      { $match: { status: { $in: ["completed", "delivered"] } } },
      { $group: { _id: null, totalVolume: { $sum: "$totalAmount" } } },
    ]);

    // Total Commission Earned
    const commissionStats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalCommission: { $sum: "$totalCommissionPaid" },
        },
      },
    ]);

    // Escrow Balance (Pending Release)
    const escrowStats = await Wallet.aggregate([
      { $group: { _id: null, totalEscrow: { $sum: "$escrowBalance" } } },
    ]);

    // Recent Transactions
    const recentTransactions = await Transaction.find()
      .sort("-createdAt")
      .limit(10)
      .populate("order", "totalAmount status");

    res.status(200).json({
      success: true,
      data: {
        totalVolume: volumeStats[0]?.totalVolume || 0,
        totalCommission: commissionStats[0]?.totalCommission || 0,
        totalEscrowHeld: escrowStats[0]?.totalEscrow || 0,
        recentTransactions,
      },
    });
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getSettings = async (req, res) => {
  // In production: Load from a SystemConfig collection
  res.status(200).json({
    success: true,
    data: {
      defaultCommissionRate: 10,
      platformName: "Social Commerce Nepal",
      supportEmail: "support@socialcommerce.np",
      maintenanceMode: false,
    },
  });
};
