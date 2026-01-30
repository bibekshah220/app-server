const mongoose = require("mongoose");
const LocationSchema = require("../shared/location.schema");
const { AMENITIES } = require("../shared/amenities");

const ProductSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    location: {
      type: LocationSchema,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please add a product name"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    price: {
      type: Number,
      required: [true, "Please add a price"],
    },
    category: {
      type: String,
      required: [true, "Please add a category"],
    },
    tags: {
      type: [String],
    },
    images: {
      type: [String], // Array of image URLs
      validate: [arrayLimit, "{PATH} exceeds the limit of 5"],
    },
    inventory: {
      type: Number,
      required: [true, "Please add inventory count"],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    discriminatorKey: "type",
  },
);

function arrayLimit(val) {
  return val.length <= 5;
}

// Don't return deleted products by default
ProductSchema.pre(/^find/, function () {
  this.find({ isDeleted: { $ne: true } });
});

// Index for geospatial queries
ProductSchema.index({ "location.coordinates": "2dsphere" });

const Product = mongoose.model("Product", ProductSchema);

// Second-Hand Discriminator
const SecondHand = Product.discriminator(
  "SecondHand",
  new mongoose.Schema({
    condition: {
      type: String,
      enum: ["Like New", "Good", "Fair", "Repair Needed"],
      required: true,
    },
    usageDuration: { type: String }, // e.g., "6 months"
    isNegotiable: { type: Boolean, default: false },
  }),
);

// Furniture Discriminator
const Furniture = Product.discriminator(
  "Furniture",
  new mongoose.Schema({
    material: { type: String },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, enum: ["cm", "in", "ft"], default: "cm" },
    },
    deliveryAvailable: { type: Boolean, default: false },
  }),
);

// Room Rental Discriminator
const Room = Product.discriminator(
  "Room",
  new mongoose.Schema({
    deposit: { type: Number, default: 0 },
    amenities: {
      type: [String],
      enum: AMENITIES,
    },
    availableFrom: { type: Date, default: Date.now },
    furnishing: {
      type: String,
      enum: ["Unfurnished", "Semi-Furnished", "Fully Furnished"],
      default: "Unfurnished",
    },
    preferredTenant: {
      type: String,
      enum: ["Any", "Family", "Student", "Couple", "Working Professional"],
      default: "Any",
    },
  }),
);

module.exports = { Product, SecondHand, Furniture, Room };
