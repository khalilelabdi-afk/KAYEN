import { z } from "zod";
import { addressSchema, idSchema, optionalText } from "./common";

export const checkoutInformationSchema = z.object({
  billingAddressId: idSchema.optional().or(z.literal("")),
  shippingAddressId: idSchema.optional().or(z.literal("")),
  sameAsBilling: z.coerce.boolean().optional(),
  newBilling: addressSchema.optional(),
  newShipping: addressSchema.optional(),
  poReference: optionalText(80),
  deliveryInstructions: optionalText(500),
  notes: optionalText(1000),
});

export const checkoutShippingSchema = z.object({ shippingMethodCode: z.string().trim().min(1).max(40) });

export const checkoutPaymentSchema = z.object({
  paymentMethod: z.enum(["CARD", "BANK_TRANSFER", "INVOICE"]),
  terms: z.literal("on", { error: "terms_required" }),
  cardNumber: z.string().trim().optional(),
  cardExpiry: z.string().trim().optional(),
  cardCvc: z.string().trim().optional(),
  cardName: z.string().trim().optional(),
});
