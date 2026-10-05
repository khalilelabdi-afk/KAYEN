import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/db";
import type { PricingPromotion, PricingContext, VariantPricingInput, UnitPriceResult } from "@/lib/pricing/types";
import { calculateUnitPrice } from "@/lib/pricing/engine";
import { getCategoryAncestorIds, getCategoryDescendantIds } from "./catalog/categories";
import { getDefaultTaxRateBps } from "./settings";
import { deserializePromotions, type ClientPromotion } from "@/lib/pricing/serialize";

export const PROMOTIONS_TAG = "promotions";

/**
 * Promotions actives (fenêtre temporelle vérifiée côté moteur avec `now`).
 * Le cache sérialise en JSON : les dates sont stockées en ISO puis reconverties.
 */
const getActivePromotionsRaw = unstable_cache(
  async (): Promise<ClientPromotion[]> => {
    const now = new Date();
    const rows = await db.promotion.findMany({
      where: {
        isActive: true,
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      include: { products: true, categories: true, brands: true },
      orderBy: { priority: "desc" },
    });
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      scope: p.scope,
      valueBps: p.valueBps,
      valueAmount: p.valueAmount,
      specialPrice: p.specialPrice,
      minQuantity: p.minQuantity,
      minOrderAmount: p.minOrderAmount,
      priority: p.priority,
      isAutomatic: p.isAutomatic,
      showBadge: p.showBadge,
      badgeLabel: p.badgeLabel,
      startsAt: p.startsAt?.toISOString() ?? null,
      endsAt: p.endsAt?.toISOString() ?? null,
      customerGroupId: p.customerGroupId,
      productIds: p.products.map((x) => x.productId),
      categoryIds: p.categories.map((x) => x.categoryId),
      brandIds: p.brands.map((x) => x.brandId),
    }));
  },
  ["active-promotions"],
  { tags: [PROMOTIONS_TAG], revalidate: 60 },
);

export async function getActivePromotions(): Promise<PricingPromotion[]> {
  return deserializePromotions(await getActivePromotionsRaw());
}

/** Ids des produits ciblés par au moins une promotion produit automatique active. */
export async function getPromotedProductIds(): Promise<string[]> {
  const promos = (await getActivePromotions()).filter((p) => p.isAutomatic && p.scope !== "ORDER" && (!p.startsAt || p.startsAt <= new Date()));
  if (!promos.length) return [];
  const productIds = new Set<string>();
  const categoryIds = new Set<string>();
  const brandIds = new Set<string>();
  for (const p of promos) {
    p.productIds.forEach((id) => productIds.add(id));
    for (const c of p.categoryIds) (await getCategoryDescendantIds(c)).forEach((id) => categoryIds.add(id));
    p.brandIds.forEach((id) => brandIds.add(id));
  }
  const or: Prisma.ProductWhereInput[] = [];
  if (productIds.size) or.push({ id: { in: [...productIds] } });
  if (categoryIds.size) or.push({ categoryId: { in: [...categoryIds] } });
  if (brandIds.size) or.push({ brandId: { in: [...brandIds] } });
  if (!or.length) return [];
  const rows = await db.product.findMany({ where: { status: "ACTIVE", OR: or }, select: { id: true } });
  return rows.map((r) => r.id);
}

/** Filtre Prisma des prix contractuels pertinents pour un contexte. */
export function customerPriceWhere(ctx: PricingContext): Prisma.CustomerPriceWhereInput {
  const or: Prisma.CustomerPriceWhereInput[] = [];
  if (ctx.businessId) or.push({ businessId: ctx.businessId });
  if (ctx.customerGroupId) or.push({ businessId: null, customerGroupId: ctx.customerGroupId });
  if (!or.length) return { id: "__none__" };
  return { OR: or };
}

/** Include Prisma standard pour tarifer une variante. */
export function variantPricingInclude(ctx: PricingContext) {
  return {
    priceTiers: { orderBy: { minQuantity: "asc" as const } },
    customerPrices: { where: customerPriceWhere(ctx) },
    inventory: true,
    product: { select: { id: true, categoryId: true, brandId: true, requiresAccount: true, taxClass: { select: { rateBps: true } } } },
  } satisfies Prisma.ProductVariantInclude;
}

export type VariantWithPricing = Prisma.ProductVariantGetPayload<{ include: ReturnType<typeof variantPricingInclude> }>;

/** Construit l'entrée du moteur de prix à partir d'une variante chargée. */
export async function buildPricingInput(variant: VariantWithPricing): Promise<VariantPricingInput> {
  const [ancestors, defaultTax] = await Promise.all([getCategoryAncestorIds(variant.product.categoryId), getDefaultTaxRateBps()]);
  return {
    variantId: variant.id,
    productId: variant.productId,
    categoryIds: ancestors,
    brandId: variant.product.brandId,
    basePrice: variant.basePrice,
    compareAtPrice: variant.compareAtPrice,
    moq: variant.moq,
    orderMultiple: variant.orderMultiple,
    quoteOnlyAbove: variant.quoteOnlyAbove,
    tiers: variant.priceTiers.map((t) => ({ minQuantity: t.minQuantity, maxQuantity: t.maxQuantity, unitPrice: t.unitPrice })),
    customerPrices: variant.customerPrices.map((c) => ({
      businessId: c.businessId,
      customerGroupId: c.customerGroupId,
      minQuantity: c.minQuantity,
      unitPrice: c.unitPrice,
      startsAt: c.startsAt,
      endsAt: c.endsAt,
    })),
    taxRateBps: variant.product.taxClass?.rateBps ?? defaultTax,
    requiresAccount: variant.product.requiresAccount,
  };
}

/** Prix unitaire d'une variante chargée, pour une quantité et un contexte. */
export async function priceVariant(variant: VariantWithPricing, quantity: number, ctx: PricingContext): Promise<{ input: VariantPricingInput; result: UnitPriceResult }> {
  const [input, promotions] = await Promise.all([buildPricingInput(variant), getActivePromotions()]);
  return { input, result: calculateUnitPrice(input, quantity, ctx, promotions) };
}

/** Disponibilité normalisée d'une variante. */
export type AvailabilityStatus = "in_stock" | "low_stock" | "backorder" | "out_of_stock";
export interface Availability {
  status: AvailabilityStatus;
  available: number;
  allowBackorder: boolean;
  leadTimeDays: number | null;
  restockAt: Date | null;
}

export function getAvailability(variant: { inventory: { quantity: number; reserved: number; lowStockThreshold: number; allowBackorder: boolean; restockAt: Date | null } | null; leadTimeDays: number | null; isActive: boolean }): Availability {
  const inv = variant.inventory;
  const available = inv ? Math.max(0, inv.quantity - inv.reserved) : 0;
  const allowBackorder = inv?.allowBackorder ?? false;
  let status: AvailabilityStatus = "in_stock";
  if (!variant.isActive) status = "out_of_stock";
  else if (available <= 0) status = allowBackorder ? "backorder" : "out_of_stock";
  else if (inv && available <= inv.lowStockThreshold) status = "low_stock";
  return { status, available, allowBackorder, leadTimeDays: variant.leadTimeDays, restockAt: inv?.restockAt ?? null };
}
