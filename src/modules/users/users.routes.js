const express = require("express");
const {
  getProfile,
  updateProfile,
  updatePassword,
  getAddresses,
  addAddress,
  deleteAddress,
  revealContact,
} = require("./users.controller");
const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/password", updatePassword);

// Addresses
router.get("/addresses", getAddresses);
router.post("/addresses", addAddress);
router.delete("/addresses/:index", deleteAddress);

// Privacy / Connect
router.post("/:id/reveal-contact", revealContact);

module.exports = router;
