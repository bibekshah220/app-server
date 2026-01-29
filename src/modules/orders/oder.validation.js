const { z } = require("zod");

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product: z.string(),
        qty: z.number().int().positive(),
      }),
    )
    .min(1, "Order must contain at least one item"),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    phone: z.string().min(10),
  }),
  paymentMethod: z.enum(["cod", "esewa", "khalti"]),
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    "shipped",
    "delivered",
    "completed",
    "cancelled",
    "refunded",
  ]),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
