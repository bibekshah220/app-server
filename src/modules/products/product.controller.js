const { Product, SecondHand, Furniture, Room } = require("./product.model");
const Seller = require("../sellers/seller.model");
const logger = require("../../config/logger");
const {
  createProductSchema,
  updateProductSchema,
} = require("./product.validation");

exports.createProduct = async (req, res) => {
  try {
    const validatedData = createProductSchema.parse(req.body);

    // Get seller profile
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller || seller.status !== "verified") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Seller not verified or does not exist",
        });
    }

    let Model = Product;
    if (validatedData.type === "SecondHand") Model = SecondHand;
    if (validatedData.type === "Furniture") Model = Furniture;
    if (validatedData.type === "Room") Model = Room;

    const product = await Model.create({
      ...validatedData,
      seller: seller._id,
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, message: err.errors });
    }
    logger.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, type } = req.query;

    let query = { isActive: true, isDeleted: false };

    if (type) query.type = type;

    if (category) query.category = category;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(query).populate(
      "seller",
      "businessName",
    );

    res
      .status(200)
      .json({ success: true, count: products.length, data: products });
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "seller",
      "businessName",
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const validatedData = updateProductSchema.parse(req.body);

    let product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const seller = await Seller.findOne({ user: req.user.id });

    // Ensure seller owns product
    if (
      product.seller.toString() !== seller._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to update this product",
        });
    }

    product = await Product.findByIdAndUpdate(req.params.id, validatedData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, message: err.errors });
    }
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const seller = await Seller.findOne({ user: req.user.id });

    if (
      req.user.role !== "admin" &&
      product.seller.toString() !== seller._id.toString()
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this product",
        });
    }

    product.isDeleted = true;
    await product.save();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
