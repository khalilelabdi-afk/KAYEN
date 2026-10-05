import { z } from "zod";
import { emailSchema, phoneSchema, optionalText, quantitySchema } from "./common";

export const quoteItemSchema = z.object({
  variantId: z.string().min(1).max(64).optional().or(z.literal("")),
  sku: z.string().trim().max(80).optional().or(z.literal("")),
  name: z.string().trim().max(200).optional().or(z.literal("")),
  quantity: quantitySchema,
});

export const quoteRequestSchema = z.object({
  source: z.enum(["PRODUCT", "CART", "CONTACT"]).default("CONTACT"),
  companyName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: phoneSchema,
  desiredDate: z.string().trim().max(10).optional().or(z.literal("")),
  message: optionalText(4000),
  items: z.array(quoteItemSchema).max(100).default([]),
  consent: z.literal("on", { error: "consent_required" }),
});
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: optionalText(120),
  email: emailSchema,
  phone: phoneSchema,
  subject: z.enum(["sales", "order", "quote", "account", "product", "other"]),
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(0).optional(), // honeypot
});
