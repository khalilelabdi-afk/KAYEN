"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { requireStaff, type ActionResult } from "@/lib/auth/dal";
import { emailSchema, fieldErrors, idSchema, moneySchema, optionalText } from "@/lib/validation/common";
import { getSettings, setSetting, SETTINGS_TAG, type CommerceSettings } from "@/services/settings";

async function audit(userId: string, action: string, entityType: string, entityId: string, before?: unknown, after?: unknown) {
  await db.auditLog.create({ data: { userId, action, entityType, entityId, before: before as Prisma.InputJsonValue, after: after as Prisma.InputJsonValue } });
}

const pick = <K extends keyof CommerceSettings>(s: CommerceSettings, keys: K[]) => Object.fromEntries(keys.map((k) => [k, s[k]])) as Pick<CommerceSettings, K>;

async function saveSettings(userId: string, group: string, values: Partial<CommerceSettings>) {
  const current = await getSettings();
  const keys = Object.keys(values) as (keyof CommerceSettings)[];
  for (const key of keys) await setSetting(key, values[key]);
  await audit(userId, `settings.${group}`, "Setting", group, pick(current, keys), values);
  revalidateTag(SETTINGS_TAG, "max");
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

// ── Coordonnées ────────────────────────────────────────────────────────────
const contactSchema = z.object({
  supportEmail: emailSchema, supportPhone: z.string().trim().min(3).max(30), supportHours: z.string().trim().max(120), salesEmail: emailSchema,
  companyAddress: z.object({ line1: z.string().trim().min(1).max(160), postalCode: z.string().trim().min(1).max(16), city: z.string().trim().min(1).max(100), countryCode: z.string().trim().length(2).toUpperCase() }),
});
export type ContactSettingsInput = z.infer<typeof contactSchema>;

export async function settingsContactAction(input: ContactSettingsInput): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  await saveSettings(user.id, "contact", parsed.data);
  return { ok: true, message: t("admin.settings.saved") };
}

// ── Commerce ───────────────────────────────────────────────────────────────
const commerceSchema = z.object({
  freeShippingThreshold: moneySchema, minimumOrderAmount: moneySchema, quoteValidityDays: z.coerce.number().int().min(1).max(365),
  defaultLeadTime: z.object({ minDays: z.coerce.number().int().min(0).max(120), maxDays: z.coerce.number().int().min(0).max(180) }).refine((v) => v.maxDays >= v.minDays, { path: ["maxDays"], message: "max_lt_min" }),
  taxIdLabel: z.string().trim().min(2).max(80), taxIdPlaceholder: z.string().trim().max(40), taxDisplay: z.enum(["HT", "TTC"]),
  bankDetails: z.string().trim().max(2000), returnPolicy: z.string().trim().max(2000), announcement: z.string().trim().max(200), newProductDays: z.coerce.number().int().min(0).max(365),
});
export type CommerceSettingsInput = z.infer<typeof commerceSchema>;

export async function settingsCommerceAction(input: CommerceSettingsInput): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = commerceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  await saveSettings(user.id, "commerce", parsed.data);
  return { ok: true, message: t("admin.settings.saved") };
}

// ── Modes de livraison ─────────────────────────────────────────────────────
const shippingSchema = z.object({
  id: idSchema.optional(), code: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/), name: z.string().trim().min(2).max(80), description: optionalText(300),
  price: moneySchema, freeAbove: moneySchema.nullable(), minDays: z.coerce.number().int().min(0).max(120), maxDays: z.coerce.number().int().min(0).max(180),
  countryCodes: z.string().trim().max(500), isActive: z.boolean(), sortOrder: z.coerce.number().int().min(0).max(9999),
}).refine((v) => v.maxDays >= v.minDays, { path: ["maxDays"], message: "max_lt_min" });
export type ShippingMethodInput = z.infer<typeof shippingSchema>;

const revalidateShipping = () => { revalidateTag("shipping", "max"); revalidateTag(SETTINGS_TAG, "max"); revalidatePath("/admin/settings"); };

export async function shippingMethodSaveAction(input: ShippingMethodInput): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = shippingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  const { id, countryCodes, ...rest } = parsed.data;
  const codes = countryCodes.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
  if (codes.some((c) => !/^[A-Z]{2}$/.test(c))) return { ok: false, error: t("common.errors.validation"), fieldErrors: { countryCodes: [t("common.errors.validation")] } };
  if (await db.shippingMethod.findFirst({ where: { code: rest.code, ...(id ? { NOT: { id } } : {}) }, select: { id: true } })) return { ok: false, error: t("common.errors.validation"), fieldErrors: { code: [t("common.errors.validation")] } };
  const before = id ? await db.shippingMethod.findUnique({ where: { id } }) : null;
  if (id && !before) return { ok: false, error: t("common.errors.notFound") };
  const data = { ...rest, description: rest.description || null, countryCodes: codes };
  const row = before ? await db.shippingMethod.update({ where: { id: before.id }, data }) : await db.shippingMethod.create({ data });
  await audit(user.id, before ? "shippingMethod.update" : "shippingMethod.create", "ShippingMethod", row.id, before ? { code: before.code, price: before.price, freeAbove: before.freeAbove, isActive: before.isActive } : null, { code: row.code, price: row.price, freeAbove: row.freeAbove, isActive: row.isActive });
  revalidateShipping();
  return { ok: true, message: t("admin.settings.shipping.saved") };
}

export async function shippingMethodDeleteAction(input: { id: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const row = await db.shippingMethod.findUnique({ where: { id: input.id } });
  if (!row) return { ok: true };
  await db.shippingMethod.delete({ where: { id: row.id } });
  await audit(user.id, "shippingMethod.delete", "ShippingMethod", row.id, { code: row.code, name: row.name }, null);
  revalidateShipping();
  return { ok: true, message: t("admin.settings.shipping.deleted") };
}

// ── Classes de TVA ─────────────────────────────────────────────────────────
const taxSchema = z.object({ id: idSchema.optional(), code: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/), name: z.string().trim().min(2).max(80), rateBps: z.coerce.number().int().min(0).max(10_000), isDefault: z.boolean() });
export type TaxClassInput = z.infer<typeof taxSchema>;

const revalidateTaxes = () => { revalidateTag("taxes", "max"); revalidateTag(SETTINGS_TAG, "max"); revalidatePath("/admin/settings"); };

export async function taxClassSaveAction(input: TaxClassInput): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = taxSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  const { id, ...data } = parsed.data;
  if (await db.taxClass.findFirst({ where: { code: data.code, ...(id ? { NOT: { id } } : {}) }, select: { id: true } })) return { ok: false, error: t("common.errors.validation"), fieldErrors: { code: [t("common.errors.validation")] } };
  const before = id ? await db.taxClass.findUnique({ where: { id } }) : null;
  if (id && !before) return { ok: false, error: t("common.errors.notFound") };
  const isDefault = data.isDefault || (await db.taxClass.count({ where: { isDefault: true, ...(id ? { NOT: { id } } : {}) } })) === 0;
  const row = await db.$transaction(async (tx) => {
    if (isDefault) await tx.taxClass.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    return before ? tx.taxClass.update({ where: { id: before.id }, data: { ...data, isDefault } }) : tx.taxClass.create({ data: { ...data, isDefault } });
  });
  await audit(user.id, before ? "taxClass.update" : "taxClass.create", "TaxClass", row.id, before ? { code: before.code, rateBps: before.rateBps, isDefault: before.isDefault } : null, { code: row.code, rateBps: row.rateBps, isDefault: row.isDefault });
  revalidateTaxes();
  return { ok: true, message: t("admin.settings.taxes.saved") };
}

export async function taxClassDeleteAction(input: { id: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const row = await db.taxClass.findUnique({ where: { id: input.id } });
  if (!row) return { ok: true };
  if (row.isDefault) return { ok: false, error: t("admin.settings.taxes.cannotDeleteDefault") };
  await db.taxClass.delete({ where: { id: row.id } });
  await audit(user.id, "taxClass.delete", "TaxClass", row.id, { code: row.code, rateBps: row.rateBps }, null);
  revalidateTaxes();
  return { ok: true, message: t("admin.settings.taxes.deleted") };
}
