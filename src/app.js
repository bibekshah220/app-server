const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const logger = require("./config/logger");

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Passport Middleware
const passport = require("./config/passport");
app.use(passport.initialize());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Basic Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Mount Routers
const authRoutes = require("./modules/auth/auth.routes");
const sellerRoutes = require("./modules/sellers/seller.routes");
const productRoutes = require("./modules/products/product.routes");
const orderRoutes = require("./modules/orders/order.routes");
const paymentRoutes = require("./modules/payments/payment.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const discoveryRoutes = require("./modules/discovery/discovery.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const usersRoutes = require("./modules/users/users.routes");
const chatRoutes = require("./modules/chat/chat.routes");

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./config/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const path = require("path");
const { protect } = require("./middlewares/auth.middleware");
const upload = require("./middlewares/upload.middleware");
const { uploadFile } = require("./modules/shared/upload.controller");

// Serve static files
app.use("/public", express.static(path.join(__dirname, "../public")));

// Health Check
app.get("/api/v1/health", (req, res) =>
  res.status(200).json({ status: "OK", message: "API is running" }),
);

// Generic Upload Route
app.post("/api/v1/upload", protect, upload.single("file"), uploadFile);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/sellers", sellerRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/discovery", discoveryRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/chats", chatRoutes);

// Error handling middleware (placeholder)
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Server Error",
  });
});

module.exports = app;
