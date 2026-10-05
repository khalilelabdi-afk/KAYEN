"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { requireStaff, type ActionResult } from "@/lib/auth/dal";
import { PROMOTIONS_TAG } from "@/services/pricing";
import { idSchema, moneySchema, optionalText, fieldErrors } from "@/lib/validation/common";

const TYPES = ["PERCENTAGE", "FIXED_AMOUNT", "SPECIAL_PRICE", "BUNDLE", "CLEARANCE", "QUANTITY"] as const;
const SCOPES = ["ORDER", "PRODUCT", "CATEGORY", "BRAND"] as const;

async function audit(userId: string, action: string, entityId: string, before?: unknown, after?: unknown) {
  await db.auditLog.create({ data: { userId, action, entityType: "Promotion", entityId, before: before as Prisma.InputJsonValue, after: after as Prisma.InputJsonValue } });
}

function revalidatePromotions(id?: string) {
  revalidateTag(PROMOTIONS_TAG, "max");
  revalidateTag("products", "max");
  revalidatePath("/admin/promotions");
  if (id) revalidatePath(`/admin/promotions/${id}`);
}

/** Date saisie ("YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm") → Date ou null. */
const dateInput = z.string().trim().max(30).nullable().transform((v, ctx) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) { ctx.addIssue({ code: "custom", message: "invalid_date" }); return z.NEVER; }
  return d;
});
const nullableInt = (min: number) => z.number().int().min(min).max(100_000_000).nullable();

const couponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(40).regex(/^[A-Z0-9_-]+$/),
  maxUses: nullableInt(1),
  isActive: z.boolean(),
  startsAt: dateInput,
  endsAt: dateInput,
});

const promotionSchema = z
  .object({
    id: z.string().max(64).optional(),
    name: z.string().trim().min(2).max(120),
    description: optionalText(1000),
    type: z.enum(TYPES),
    scope: z.enum(SCOPES),
    valueBps: z.number().int().min(1).max(10_000).nullable(),
    valueAmount: moneySchema.nullable(),
    specialPrice: moneySchema.nullable(),
    minQuantity: nullableInt(1),
    minOrderAmount: moneySchema.nullable(),
    isAutomatic: z.boolean(),
    isActive: z.boolean(),
    startsAt: dateInput,
    endsAt: dateInput,
    maxUses: nullableInt(1),
    maxUsesPerCustomer: nullableInt(1),
    customerGroupId: z.string().max(64).nullable(),
    priority: z.number().int().min(-1000).max(1000),
    showBadge: z.boolean(),
    badgeLabel: optionalText(40),
    productSkus: z.array(z.string().trim().min(1).max(64)).max(500),
    categoryIds: z.array(idSchema).max(200),
    brandIds: z.array(idSchema).max(200),
    coupons: z.array(couponSchema).max(100),
  })
  .superRefine((p, ctx) => {
    const need = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    if (p.type === "PERCENTAGE" && p.valueBps === null) need("valueBps", "value_required");
    if ((p.type === "QUANTITY" || p.type === "BUNDLE") && p.valueBps === null) need("valueBps", "value_required");
    if ((p.type === "QUANTITY" || p.type === "BUNDLE") && p.minQuantity === null) need("minQuantity", "value_required");
    if (p.type === "FIXED_AMOUNT" && (p.valueAmount === null || p.valueAmount <= 0)) need("valueAmount", "value_required");
    if ((p.type === "SPECIAL_PRICE" || p.type === "CLEARANCE") && p.specialPrice === null) need("specialPrice", "value_required");
    if (p.scope === "ORDER" && p.type !== "PERCENTAGE" && p.type !== "FIXED_AMOUNT") need("scope", "scope_type");
    if (p.scope === "PRODUCT" && !p.productSkus.length) need("productSkus", "targets_required");
    if (p.scope === "CATEGORY" && !p.categoryIds.length) need("categoryIds", "targets_required");
    if (p.scope === "BRAND" && !p.brandIds.length) need("brandIds", "targets_required");
    if (!p.isAutomatic && !p.coupons.length) need("coupons", "coupon_required");
    if (p.startsAt && p.endsAt && p.endsAt < p.startsAt) need("endsAt", "dates_invalid");
    const codes = p.coupons.map((c) => c.code);
    if (new Set(codes).size !== codes.length) need("coupons", "duplicate");
  });
export type PromotionPayload = z.input<typeof promotionSchema>;

/** Crée ou met à jour une promotion avec ses cibles et ses codes promo (transaction). */
export async function promotionSaveAction(input: PromotionPayload): Promise<ActionResult<{ id: string }>> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = promotionSchema.safeParse(input);
  if (!parsed.success) {
    const fe = fieldErrors(parsed.error);
    const first = Object.values(fe)[0]?.[0] ?? "";
    const message = first === "value_required" ? t("admin.promotions.form.valueRequired") : first === "targets_required" ? t("admin.promotions.form.targetsRequired") : first === "coupon_required" ? t("admin.promotions.form.couponRequired") : first === "scope_type" ? t("admin.promotions.form.scopeTypeMismatch") : first === "dates_invalid" ? t("admin.promotions.form.datesInvalid") : t("common.errors.validation");
    return { ok: false, error: message, fieldErrors: fe };
  }
  const p = parsed.data;
  // Résolution des SKU (produit parent ou variante) → ids produit
  const skus = [...new Set(p.productSkus.map((s) => s.toUpperCase()))];
  const products = skus.length ? await db.product.findMany({ where: { OR: [{ sku: { in: skus, mode: "insensitive" } }, { variants: { some: { sku: { in: skus, mode: "insensitive" } } } }] }, select: { id: true, sku: true, variants: { select: { sku: true } } } }) : [];
  const known = new Set(products.flatMap((pr) => [pr.sku.toUpperCase(), ...pr.variants.map((v) => v.sku.toUpperCase())]));
  const unknown = skus.filter((s) => !known.has(s));
  if (unknown.length) return { ok: false, error: t("admin.promotions.form.unknownSkus", { skus: unknown.slice(0, 10).join(", ") }), fieldErrors: { productSkus: unknown } };
  const productIds = p.scope === "PRODUCT" ? products.map((pr) => pr.id) : [];
  const categoryIds = p.scope === "CATEGORY" ? [...new Set(p.categoryIds)] : [];
  const brandIds = p.scope === "BRAND" ? [...new Set(p.brandIds)] : [];
  // Codes promo : uniques globalement
  const taken = p.coupons.length ? await db.coupon.findFirst({ where: { code: { in: p.coupons.map((c) => c.code) }, ...(p.id ? { promotionId: { not: p.id } } : {}) }, select: { code: true } }) : null;
  if (taken) return { ok: false, error: t("admin.promotions.form.couponTaken", { code: taken.code }), fieldErrors: { coupons: [taken.code] } };
  const before = p.id ? await db.promotion.findUnique({ where: { id: p.id } }) : null;
  if (p.id && !before) return { ok: false, error: t("common.errors.notFound") };

  const data = {
    name: p.name, description: p.description || null, type: p.type, scope: p.scope,
    valueBps: p.type === "PERCENTAGE" || p.type === "QUANTITY" || p.type === "BUNDLE" ? p.valueBps : null,
    valueAmount: p.type === "FIXED_AMOUNT" ? p.valueAmount : null,
    specialPrice: p.type === "SPECIAL_PRICE" || p.type === "CLEARANCE" ? p.specialPrice : null,
    minQuantity: p.minQuantity, minOrderAmount: p.minOrderAmount, isAutomatic: p.isAutomatic, isActive: p.isActive, startsAt: p.startsAt, endsAt: p.endsAt,
    maxUses: p.maxUses, maxUsesPerCustomer: p.maxUsesPerCustomer, customerGroupId: p.customerGroupId || null, priority: p.priority, showBadge: p.showBadge, badgeLabel: p.badgeLabel || null,
  };
  const saved = await db.$transaction(async (tx) => {
    const row = before ? await tx.promotion.update({ where: { id: before.id }, data }) : await tx.promotion.create({ data });
    await tx.promotionProduct.deleteMany({ where: { promotionId: row.id } });
    await tx.promotionCategory.deleteMany({ where: { promotionId: row.id } });
    await tx.promotionBrand.deleteMany({ where: { promotionId: row.id } });
    if (productIds.length) await tx.promotionProduct.createMany({ data: productIds.map((productId) => ({ promotionId: row.id, productId })), skipDuplicates: true });
    if (categoryIds.length) await tx.promotionCategory.createMany({ data: categoryIds.map((categoryId) => ({ promotionId: row.id, categoryId })), skipDuplicates: true });
    if (brandIds.length) await tx.promotionBrand.createMany({ data: brandIds.map((brandId) => ({ promotionId: row.id, brandId })), skipDuplicates: true });
    await tx.coupon.deleteMany({ where: { promotionId: row.id, code: { notIn: p.coupons.map((c) => c.code) } } });
    for (const c of p.coupons) {
      const cdata = { maxUses: c.maxUses, isActive: c.isActive, startsAt: c.startsAt, endsAt: c.endsAt };
      await tx.coupon.upsert({ where: { code: c.code }, create: { ...cdata, code: c.code, promotionId: row.id }, update: cdata });
    }
    return row;
  });
  await audit(user.id, before ? "promotion.update" : "promotion.create", saved.id, before ? { name: before.name, type: before.type, scope: before.scope, isActive: before.isActive } : null, { name: p.name, type: p.type, scope: p.scope, isActive: p.isActive, products: productIds.length, categories: categoryIds.length, brands: brandIds.length, coupons: p.coupons.length });
  revalidatePromotions(saved.id);
  return { ok: true, data: { id: saved.id }, message: t("admin.promotions.form.saved") };
}

export async function promotionToggleAction(input: { id: string; isActive: boolean }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = z.object({ id: idSchema, isActive: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const { id, isActive } = parsed.data;
  const before = await db.promotion.findUnique({ where: { id }, select: { isActive: true } });
  if (!before) return { ok: false, error: t("common.errors.notFound") };
  await db.promotion.update({ where: { id }, data: { isActive } });
  await audit(user.id, "promotion.toggle", id, { isActive: before.isActive }, { isActive });
  revalidatePromotions(id);
  return { ok: true, message: t("admin.promotions.form.toggled") };
}

export async function promotionDeleteAction(input: { id: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = z.object({ id: idSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const before = await db.promotion.findUnique({ where: { id: parsed.data.id }, select: { name: true, type: true } });
  if (!before) return { ok: true };
  await db.promotion.delete({ where: { id: parsed.data.id } });
  await audit(user.id, "promotion.delete", parsed.data.id, before, null);
  revalidatePromotions();
  return { ok: true, message: t("admin.promotions.form.deleted") };
}
