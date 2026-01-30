const express = require("express");
const {
  createSellerProfile,
  getMe,
  updateSellerStatus,
  getAllSellers,
  submitKyc,
  getKycStatus,
  verifyKyc,
} = require("./seller.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");

const router = express.Router();

// Seller Profile
router.post("/", protect, createSellerProfile);
router.get("/me", protect, getMe);

// KYC Management
router.post("/kyc", protect, submitKyc);
router.get("/kyc", protect, getKycStatus);

// Admin Routes
router.get("/", protect, authorize("admin"), getAllSellers);
router.put("/:id/status", protect, authorize("admin"), updateSellerStatus);
router.put("/:id/kyc/verify", protect, authorize("admin"), verifyKyc);

module.exports = router;
