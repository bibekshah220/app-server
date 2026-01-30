const express = require("express");
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("./product.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProduct);

router.post("/", protect, authorize("seller", "admin"), createProduct);
router.put("/:id", protect, authorize("seller", "admin"), updateProduct);
router.delete("/:id", protect, authorize("seller", "admin"), deleteProduct);

module.exports = router;
