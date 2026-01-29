const express = require("express");
const {
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
} = require("./order.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/myorders", protect, getMyOrders);
router.get("/seller", protect, authorize("seller", "admin"), getSellerOrders);
router.put(
  "/:id/status",
  protect,
  authorize("seller", "admin"),
  updateOrderStatus,
);

module.exports = router;
