const express = require("express");
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getAllSellers,
  updateSellerStatus,
  getAllProducts,
  toggleProductVisibility,
  getAllOrders,
  getFinancialStats,
  getSettings,
  verifySellerKyc,
} = require("./admin.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");

const router = express.Router();

// All routes require Admin role
router.use(protect, authorize("admin"));

// User Management
router.get("/users", getAllUsers);
router.get("/users/:id", getUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Seller Management
router.get("/sellers", getAllSellers);
router.put("/sellers/:id/status", updateSellerStatus);
router.put("/sellers/:id/kyc", verifySellerKyc);

// Product Moderation
router.get("/products", getAllProducts);
router.put("/products/:id/toggle", toggleProductVisibility);

// Order Management
router.get("/orders", getAllOrders);

// Financials
router.get("/financials", getFinancialStats);

// System Settings
router.get("/settings", getSettings);

module.exports = router;
