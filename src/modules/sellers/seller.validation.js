const { z } = require("zod");
const { locationValidationSchema } = require("../shared/location.validation");

const createSellerSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  socialProfiles: z
    .object({
      instagram: z.string().url().optional().or(z.literal("")),
      facebook: z.string().url().optional().or(z.literal("")),
      tiktok: z.string().url().optional().or(z.literal("")),
      tiktok: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
  location: locationValidationSchema,
});

const updateStatusSchema = z.object({
  status: z.enum(["pending", "verified", "suspended"]),
  commissionRate: z.number().min(0).max(100).optional(),
});

// Nepal-specific KYC submission schema
const submitKycSchema = z.object({
  documentType: z.enum(["citizenship", "passport", "national_id"]),
  documentNumber: z.string().min(1, "Document number is required"),
  fullNameAsPerDocument: z.string().min(2),
  dateOfBirth: z.string(), // ISO date string
  issuedDate: z.string().optional(),
  issuedDistrict: z.string().optional(), // Required for citizenship
  expiryDate: z.string().optional(), // Required for passport
  fatherName: z.string().optional(),
  grandfatherName: z.string().optional(), // Required for Nepal citizenship
  permanentAddress: z
    .object({
      district: z.string(),
      municipality: z.string(),
      ward: z.string(),
      tole: z.string().optional(),
    })
    .optional(),
  documents: z.object({
    frontImage: z.string().url(),
    backImage: z.string().url().optional(),
    selfieWithDocument: z.string().url().optional(),
  }),
});

// Admin KYC verification schema
const verifyKycSchema = z.object({
  status: z.enum(["verified", "rejected"]),
  rejectionReason: z.string().optional(),
});

module.exports = {
  createSellerSchema,
  updateStatusSchema,
  submitKycSchema,
  verifyKycSchema,
};
