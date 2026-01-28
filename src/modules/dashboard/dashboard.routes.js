const express = require("express");
const {
  getBuyerStats,
  getSellerStats,
  getAdminStats,
} = require("./dashboard.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/buyer", protect, getBuyerStats);
router.get("/seller", protect, authorize("seller", "admin"), getSellerStats);
router.get("/admin", protect, authorize("admin"), getAdminStats);

module.exports = router;
