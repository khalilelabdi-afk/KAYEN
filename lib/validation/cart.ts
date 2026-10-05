import { z } from "zod";
import { idSchema, quantitySchema } from "./common";

export const addToCartSchema = z.object({
  variantId: idSchema,
  quantity: quantitySchema.default(1),
});

export const updateCartItemSchema = z.object({
  itemId: idSchema,
  quantity: z.coerce.number().int().min(0).max(1_000_000),
});

export const bulkAddSchema = z.object({
  items: z.array(z.object({ variantId: idSchema, quantity: quantitySchema })).min(1).max(200),
});

export const couponSchema = z.object({ code: z.string().trim().toUpperCase().min(2).max(40) });

export const quickOrderLineSchema = z.object({ sku: z.string().trim().min(1).max(80), quantity: quantitySchema });
export const quickOrderSchema = z.object({ lines: z.array(quickOrderLineSchema).min(1).max(500) });
