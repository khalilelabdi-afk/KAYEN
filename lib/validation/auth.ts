import { z } from "zod";
import { emailSchema, passwordSchema, phoneSchema, optionalText } from "./common";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  remember: z.coerce.boolean().optional(),
  next: z.string().max(500).optional(),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
    company: z.string().trim().min(2).max(120),
    sectorId: optionalText(64),
    activityLabel: optionalText(120),
    taxId: optionalText(40),
    line1: optionalText(160),
    postalCode: optionalText(16),
    city: optionalText(100),
    countryCode: z.string().trim().length(2).toUpperCase().default("FR"),
    terms: z.literal("on", { error: "terms_required" }),
    next: z.string().max(500).optional(),
  })
  .refine((d) => d.password === d.passwordConfirm, { path: ["passwordConfirm"], message: "password_mismatch" });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10).max(200),
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, { path: ["passwordConfirm"], message: "password_mismatch" });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, { path: ["passwordConfirm"], message: "password_mismatch" });

export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: phoneSchema,
  locale: z.enum(["fr", "en", "ar"]).optional(),
});
