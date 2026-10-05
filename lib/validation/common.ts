import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .regex(/^[+\d][\d\s().-]{5,}$/, "invalid_phone")
  .optional()
  .or(z.literal(""));
export const passwordSchema = z.string().min(8).max(128);
export const slugSchema = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const idSchema = z.string().min(1).max(64);
export const quantitySchema = z.coerce.number().int().min(1).max(1_000_000);
export const moneySchema = z.coerce.number().int().min(0).max(1_000_000_000);
export const optionalText = (max = 2000) => z.string().trim().max(max).optional().or(z.literal(""));

export const addressSchema = z.object({
  label: optionalText(60),
  type: z.enum(["BILLING", "SHIPPING", "BOTH"]).default("BOTH"),
  company: optionalText(120),
  firstName: optionalText(80),
  lastName: optionalText(80),
  line1: z.string().trim().min(3).max(160),
  line2: optionalText(160),
  postalCode: z.string().trim().min(2).max(16),
  city: z.string().trim().min(1).max(100),
  region: optionalText(100),
  countryCode: z.string().trim().length(2).toUpperCase().default("FR"),
  phone: phoneSchema,
  instructions: optionalText(500),
  isDefaultBilling: z.coerce.boolean().optional(),
  isDefaultShipping: z.coerce.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

/** Convertit un FormData en objet brut (champs multiples → tableau). */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    if (key.endsWith("[]")) {
      const k = key.slice(0, -2);
      const existing = out[k] as string[] | undefined;
      if (existing) existing.push(value);
      else out[k] = [value];
    } else if (key in out) {
      const current = out[key];
      out[key] = Array.isArray(current) ? [...current, value] : [current, value];
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Transforme les erreurs Zod en map champ → messages (clés i18n ou messages). */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_";
    (out[path] ??= []).push(issue.message);
  }
  return out;
}
