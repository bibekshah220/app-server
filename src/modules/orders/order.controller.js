const Order = require("./order.model");
const { Product } = require("../products/product.model");
const Seller = require("../sellers/seller.model");
const logger = require("../../config/logger");
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require("./order.validation");

exports.createOrder = async (req, res) => {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    const { items, shippingAddress, paymentMethod } = validatedData;

    // 1. Fetch products and validate stock/existence
    const productIds = items.map((i) => i.product);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    if (dbProducts.length !== items.length) {
      return res
        .status(400)
        .json({ success: false, message: "Some products not found" });
    }

    // Map DB products for easy access
    const productMap = {};
    dbProducts.forEach((p) => {
      productMap[p._id.toString()] = p;
    });

    // 2. Group items by Seller
    const ordersBySeller = {}; // sellerId: [items]

    for (const item of items) {
      const product = productMap[item.product];

      if (product.inventory < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.name}`,
        });
      }

      const sellerId = product.seller.toString();
      if (!ordersBySeller[sellerId]) {
        ordersBySeller[sellerId] = [];
      }

      ordersBySeller[sellerId].push({
        product: product._id,
        name: product.name,
        qty: item.qty,
        price: product.price,
        image: product.images[0] || "",
      });
    }

    // 3. Create Orders and Decrement Stock
    const createdOrders = [];

    for (const sellerId of Object.keys(ordersBySeller)) {
      const sellerItems = ordersBySeller[sellerId];
      const totalAmount = sellerItems.reduce(
        (acc, item) => acc + item.price * item.qty,
        0,
      );

      // Configurable: Add delivery fee logic here? (Simplified to 0 or fixed for now)

      const order = await Order.create({
        user: req.user.id,
        seller: sellerId,
        items: sellerItems,
        shippingAddress,
        paymentInfo: {
          method: paymentMethod,
          status: "pending", // If online payment, this would be 'waiting_payment'
        },
        totalAmount,
        status: "pending",
      });

      createdOrders.push(order);

      // Update Inventory
      for (const item of sellerItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { inventory: -item.qty },
        });
      }
    }

    res.status(201).json({
      success: true,
      count: createdOrders.length,
      data: createdOrders,
      message: `Created ${createdOrders.length} order(s)`,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, message: err.errors });
    }
    logger.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("seller", "businessName")
      .sort("-createdAt");

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getSellerOrders = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller)
      return res
        .status(404)
        .json({ success: false, message: "Seller profile not found" });

    const orders = await Order.find({ seller: seller._id })
      .populate("user", "name email")
      .sort("-createdAt");

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = updateOrderStatusSchema.parse(req.body);

    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    // Check ownership
    if (req.user.role !== "admin") {
      const seller = await Seller.findOne({ user: req.user.id });
      if (!seller || order.seller.toString() !== seller._id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }
    }

    order.status = status;
    const { releaseEscrow } = require("../payments/payment.service");

    if (status === "delivered") {
      order.deliveredAt = Date.now();
      // Release Payment to Seller
      try {
        await releaseEscrow(order._id);
      } catch (pErr) {
        logger.error(
          `Escrow Release Failed for Order ${order._id}: ${pErr.message}`,
        );
        // Proceed but log error - manual intervention might be needed
      }
    }
    if (status === "shipped") {
      order.shippedAt = Date.now();
    }

    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
