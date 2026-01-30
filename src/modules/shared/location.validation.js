const { z } = require("zod");

// Zod schema matching the Mongoose LocationSchema
const locationValidationSchema = z.object({
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  city: z.string().min(1, "City is required"),
  ward: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  landmark: z.string().optional(),
  coordinates: z
    .array(z.number())
    .length(2, "Coordinates must be [longitude, latitude]"),
  type: z.literal("Point").optional().default("Point"),
});

module.exports = { locationValidationSchema };
