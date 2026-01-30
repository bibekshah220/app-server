const mongoose = require("mongoose");
const LocationSchema = require("../shared/location.schema");

const SellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, "Please add a business name"],
      trim: true,
    },
    socialProfiles: {
      instagram: { type: String },
      facebook: { type: String },
      tiktok: { type: String },
    },
    // Nepal-specific KYC Documents
    kyc: {
      documentType: {
        type: String,
        enum: ["citizenship", "passport", "national_id"],
        required: false,
      },
      documentNumber: {
        type: String,
      },
      fullNameAsPerDocument: {
        type: String,
      },
      dateOfBirth: {
        type: Date,
      },
      issuedDate: {
        type: Date,
      },
      issuedDistrict: {
        type: String, // For citizenship
      },
      expiryDate: {
        type: Date, // For passport
      },
      fatherName: {
        type: String,
      },
      grandfatherName: {
        type: String, // Required for Nepal citizenship
      },
      permanentAddress: {
        district: String,
        municipality: String,
        ward: String,
        tole: String,
      },
      documents: {
        frontImage: { type: String }, // URL to uploaded image
        backImage: { type: String }, // URL to uploaded image (for citizenship)
        selfieWithDocument: { type: String }, // Selfie holding document
      },
      verificationStatus: {
        type: String,
        enum: ["not_submitted", "pending", "verified", "rejected"],
        default: "not_submitted",
      },
      rejectionReason: {
        type: String,
      },
      verifiedAt: {
        type: Date,
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    status: {
      type: String,
      enum: ["pending", "verified", "suspended"],
      default: "pending",
    },
    commissionRate: {
      type: Number,
      default: 10,
    },
    location: {
      type: LocationSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for geospatial queries
SellerSchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("Seller", SellerSchema);
