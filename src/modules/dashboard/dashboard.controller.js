const Order = require("../orders/order.model");
const Product = require("../products/product.model");
const Wallet = require("../payments/wallet.model");
const Seller = require("../sellers/seller.model");
const mongoose = require("mongoose");

//  Get Buyer Dashboard Stats

exports.getBuyerStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const stats = await Order.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          activeOrders: {
            $sum: {
              $cond: [
                { $in: ["$status", ["pending", "paid", "shipped"]] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || { totalOrders: 0, totalSpent: 0, activeOrders: 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//    Get Seller Dashboard Stats

exports.getSellerStats = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    const sellerId = seller._id;

    // 1. Order Stats
    const orderStats = await Order.aggregate([
      { $match: { seller: sellerId } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }, // Gross
          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
        },
      },
    ]);

    // 2. Wallet Stats
    const wallet = (await Wallet.findOne({ seller: sellerId })) || {
      balance: 0,
      escrowBalance: 0,
      totalCommissionPaid: 0,
    };

    // 3. Best Selling Products
    const bestSelling = await Order.aggregate([
      { $match: { seller: sellerId, status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          totalSold: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders: orderStats[0] || {
          totalSales: 0,
          totalRevenue: 0,
          pendingOrders: 0,
        },
        wallet: {
          availableBalance: wallet.balance,
          escrowBalance: wallet.escrowBalance,
          totalCommissionPaid: wallet.totalCommissionPaid,
        },
        bestSellingProducts: bestSelling,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// *  Get Admin Dashboard Stats
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await require("../auth/user.model").countDocuments({
      role: "buyer",
    });
    const totalSellers = await Seller.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const financials = await Order.aggregate([
      { $match: { status: "completed" } }, // rough estimate
      { $group: { _id: null, totalVolume: { $sum: "$totalAmount" } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: totalUsers,
        sellers: totalSellers,
        products: totalProducts,
        orders: totalOrders,
        volume: financials[0] ? financials[0].totalVolume : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
