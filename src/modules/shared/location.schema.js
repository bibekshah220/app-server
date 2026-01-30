const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      // index: '2dsphere' // Indexes are usually defined at the parent schema level
    },
    province: {
      type: String,
      required: [true, "Province is required"],
    },
    district: {
      type: String,
      required: [true, "District is required"],
    },
    city: {
      type: String,
      required: [true, "City/Municipality is required"],
    },
    ward: {
      type: Number,
      required: [true, "Ward number is required"],
    },
    landmark: {
      type: String,
    },
    addressLine: {
      type: String, // Full formatted address string for display
    },
  },
  { _id: false },
);

module.exports = LocationSchema;
