import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});
export const quantitySchema = z.object({
  quantity: z.number().int().positive(),
});
export const checkoutSchema = z.object({
  addressId: z.number().int().positive(),
  shippingMethod: z.enum(["standard", "express", "free"]),
  paymentMethod: z.string().default("mock_card"),
});
export const addressSchema = z.object({
  label: z.string().optional().nullable(),
  full_name: z.string().min(1),
  street_line_1: z.string().min(1),
  street_line_2: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip_code: z.string().min(1),
  country: z.string().default("US"),
  phone: z.string().optional().nullable(),
  is_default: z.boolean().default(false),
});
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
});
export const productSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  short_description: z.string().optional().nullable(),
  price: z.coerce.number().positive().optional(),
  compare_at_price: z.coerce.number().positive().optional().nullable(),
  cost_price: z.coerce.number().positive().optional().nullable(),
  sku: z.string().min(1).optional(),
  category_id: z.number().int().positive().optional().nullable(),
  stock_quantity: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  weight: z.coerce.number().optional().nullable(),
});
export const statusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});
