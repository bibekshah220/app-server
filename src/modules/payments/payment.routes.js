const express = require("express");
const {
  initiatePayment,
  initiateEsewaPayment,
  handleEsewaSuccess,
  handleEsewaFailure,
  paymentWebhook,
  getWallet,
} = require("./payment.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/initiate", protect, initiatePayment); // Keep mock for now
router.post("/esewa/initiate", protect, initiateEsewaPayment);
router.get("/esewa/success", handleEsewaSuccess);
router.get("/esewa/failure", handleEsewaFailure);

router.post("/webhook", paymentWebhook);
router.get("/wallet", protect, authorize("seller", "admin"), getWallet);

module.exports = router;
