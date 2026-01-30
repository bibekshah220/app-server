const { z } = require("zod");
const { locationValidationSchema } = require("../shared/location.validation");
const { AMENITIES } = require("../shared/amenities");

// Base Product Schema
const baseProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().positive(),
  category: z.string(),
  tags: z.array(z.string()).optional(),
  inventory: z.number().int().nonnegative(),
  images: z.array(z.string().url()).optional(),
  location: locationValidationSchema.optional(), // Inherits from seller if missing
  type: z
    .enum(["Product", "SecondHand", "Furniture", "Room"])
    .default("Product"),
});

// Second Hand Specifics
const secondHandSchema = baseProductSchema.extend({
  type: z.literal("SecondHand"),
  condition: z.enum(["Like New", "Good", "Fair", "Repair Needed"]),
  usageDuration: z.string().optional(),
  isNegotiable: z.boolean().default(false),
});

// Furniture Specifics
const furnitureSchema = baseProductSchema.extend({
  type: z.literal("Furniture"),
  material: z.string().optional(),
  dimensions: z
    .object({
      length: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      unit: z.enum(["cm", "in", "ft"]).default("cm"),
    })
    .optional(),
  deliveryAvailable: z.boolean().default(false),
});

// Room Specifics
const roomSchema = baseProductSchema.extend({
  type: z.literal("Room"),
  deposit: z.number().nonnegative().default(0),
  amenities: z.array(z.enum(AMENITIES)).optional(),
  availableFrom: z.string().optional(), // ISO Date
  furnishing: z
    .enum(["Unfurnished", "Semi-Furnished", "Fully Furnished"])
    .default("Unfurnished"),
  preferredTenant: z
    .enum(["Any", "Family", "Student", "Couple", "Working Professional"])
    .default("Any"),
});

// Union Schema for payload validation
const createProductSchema = z.union([
  baseProductSchema,
  secondHandSchema,
  furnitureSchema,
  roomSchema,
]);

const updateProductSchema = baseProductSchema.partial().extend({
  isActive: z.boolean().optional(),
  // Allow updating specific fields optionally
  condition: z.enum(["Like New", "Good", "Fair", "Repair Needed"]).optional(),
  usageDuration: z.string().optional(),
  isNegotiable: z.boolean().optional(),
  material: z.string().optional(),
  deliveryAvailable: z.boolean().optional(),
  deposit: z.number().optional(),
  amenities: z.array(z.enum(AMENITIES)).optional(),
  furnishing: z
    .enum(["Unfurnished", "Semi-Furnished", "Fully Furnished"])
    .optional(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
};
