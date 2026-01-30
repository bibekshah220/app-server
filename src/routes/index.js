const express = require("express");
const router = express.Router();

// Import all module routes
const authRoutes = require("../modules/auth/auth.routes");
const sellerRoutes = require("../modules/sellers/seller.routes");
const productRoutes = require("../modules/products/product.routes");
const orderRoutes = require("../modules/orders/order.routes");
const paymentRoutes = require("../modules/payments/payment.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const adminRoutes = require("../modules/admin/admin.routes");
const usersRoutes = require("../modules/users/users.routes");

// Health Check
router.get("/health", (req, res) =>
  res.status(200).json({ status: "OK", message: "API is running" }),
);

// Mount routes
router.use("/auth", authRoutes);
router.use("/sellers", sellerRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/admin", adminRoutes);
router.use("/users", usersRoutes);

module.exports = router;
