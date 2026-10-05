import "server-only";
import { db, type Prisma } from "@/lib/db";
import type { PricingContext, PricingPromotion } from "@/lib/pricing/types";
import { calculateUnitPrice } from "@/lib/pricing/engine";
import { lowestTierPrice } from "@/lib/pricing/tiers";
import type { ProductCardData, ListingResult, ListingFacets, SortKey, FacetValue, AttributeFacet } from "@/types/catalog";
import type { ListingParams } from "@/lib/catalog/listing-params";
import { siteConfig } from "@/lib/config/site";
import { buildPricingInput, getActivePromotions, getAvailability, getPromotedProductIds, variantPricingInclude, type VariantWithPricing } from "@/services/pricing";
import { getCategoryDescendantIds, getCategoryFilterAttributes } from "./categories";
import { getBrands } from "./brands";
import { getSettings } from "@/services/settings";

/** Sélection Prisma d'un produit pour une carte. */
export function productCardInclude(ctx: PricingContext) {
  return {
    brand: { select: { name: true, slug: true } },
    images: { orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }], take: 1, select: { url: true, alt: true } },
    variants: {
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" as const }, { position: "asc" as const }],
      include: variantPricingInclude(ctx),
    },
  } satisfies Prisma.ProductInclude;
}

export type ProductForCard = Prisma.ProductGetPayload<{ include: ReturnType<typeof productCardInclude> }>;

const BESTSELLER_THRESHOLD = 150;

/** Transforme un produit Prisma en données de carte (prix calculés par le moteur). */
export async function toProductCard(
  product: ProductForCard,
  ctx: PricingContext,
  promotions: PricingPromotion[],
  newProductDays: number = siteConfig.newProductDays,
): Promise<ProductCardData | null> {
  const variant: VariantWithPricing | undefined = product.variants[0];
  if (!variant) return null;
  const input = await buildPricingInput(variant);
  const atMoq = calculateUnitPrice(input, variant.moq, ctx, promotions);
  const lowest = Math.min(atMoq.unitPrice, lowestTierPrice(atMoq.unitPrice, input.tiers));
  const availability = getAvailability(variant);
  const isNew = product.publishedAt ? Date.now() - product.publishedAt.getTime() < newProductDays * 86_400_000 : false;
  const promo = atMoq.promotion;
  const isClearance = promo?.type === "CLEARANCE";
  return {
    id: product.id,
    slug: product.slug,
    sku: variant.sku,
    name: product.name,
    href: `/p/${product.slug}`,
    brand: product.brand,
    image: product.images[0] ?? null,
    variantId: variant.id,
    hasVariants: product.hasVariants,
    variantCount: product.variants.length,
    unitLabel: variant.unitLabel,
    packagingLabel: variant.packagingLabel,
    moq: variant.moq,
    orderMultiple: variant.orderMultiple,
    price: {
      unitPrice: atMoq.unitPrice,
      baseUnitPrice: atMoq.baseUnitPrice,
      compareAtUnitPrice: atMoq.compareAtUnitPrice,
      lowestUnitPrice: lowest,
      hasTiers: input.tiers.length > 0,
      nextTier: atMoq.nextTier ? { minQuantity: atMoq.nextTier.tier.minQuantity, savingsPercent: atMoq.nextTier.savingsPercent } : null,
      savingsPercent: atMoq.savingsPercent,
      source: atMoq.source,
      promotionBadge: promo && promo.showBadge ? (promo.badgeLabel ?? (promo.type === "PERCENTAGE" && promo.valueBps ? `-${Math.round(promo.valueBps / 100)} %` : "Promo")) : null,
      hidden: atMoq.hidden,
      requiresQuote: atMoq.requiresQuote,
    },
    availability: { ...availability, restockAt: availability.restockAt?.toISOString() ?? null },
    badges: { isNew, isPromo: promo !== null, isBestseller: product.salesCount >= BESTSELLER_THRESHOLD, isClearance },
  };
}

export async function toProductCards(products: ProductForCard[], ctx: PricingContext): Promise<ProductCardData[]> {
  const [promotions, settings] = await Promise.all([getActivePromotions(), getSettings()]);
  const cards = await Promise.all(products.map((p) => toProductCard(p, ctx, promotions, settings.newProductDays)));
  return cards.filter((c): c is ProductCardData => c !== null);
}

function orderBy(sort: SortKey): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ priceFrom: "asc" }, { name: "asc" }];
    case "price_desc":
      return [{ priceFrom: "desc" }, { name: "asc" }];
    case "newest":
      return [{ publishedAt: "desc" }, { name: "asc" }];
    case "name_asc":
      return [{ name: "asc" }];
    case "bestsellers":
    case "popular":
    case "promo":
    case "relevance":
    default:
      return [{ salesCount: "desc" }, { viewCount: "desc" }, { name: "asc" }];
  }
}

export interface ListingScope {
  categoryId?: string;
  brandId?: string;
  sectorCategoryIds?: string[];
  /** Ids ordonnés (recherche) : le tri "relevance" respecte cet ordre. */
  ids?: string[];
  onlyPromo?: boolean;
  onlyNew?: boolean;
  onlyBestsellers?: boolean;
}

async function buildWhere(scope: ListingScope, params: ListingParams, opts: { excludeBrands?: boolean; excludeAttrs?: boolean; excludePrice?: boolean } = {}): Promise<Prisma.ProductWhereInput> {
  const and: Prisma.ProductWhereInput[] = [{ status: "ACTIVE" }];
  if (scope.categoryId) and.push({ categoryId: { in: await getCategoryDescendantIds(scope.categoryId) } });
  if (scope.sectorCategoryIds?.length) {
    const ids = (await Promise.all(scope.sectorCategoryIds.map((id) => getCategoryDescendantIds(id)))).flat();
    and.push({ categoryId: { in: ids } });
  }
  if (scope.brandId) and.push({ brandId: scope.brandId });
  if (scope.ids) and.push({ id: { in: scope.ids } });
  if (scope.onlyBestsellers) and.push({ salesCount: { gte: BESTSELLER_THRESHOLD } });
  const settings = await getSettings();
  const newSince = new Date(Date.now() - settings.newProductDays * 86_400_000);
  if (scope.onlyNew || params.isNew) and.push({ publishedAt: { gte: newSince } });
  if (scope.onlyPromo || params.promo) and.push({ id: { in: await getPromotedProductIds() } });
  if (!opts.excludeBrands && params.brands.length) and.push({ brand: { slug: { in: params.brands } } });
  if (!opts.excludePrice && (params.priceMin !== null || params.priceMax !== null)) {
    and.push({ priceFrom: { ...(params.priceMin !== null ? { gte: params.priceMin } : {}), ...(params.priceMax !== null ? { lte: params.priceMax } : {}) } });
  }
  if (params.inStock) and.push({ variants: { some: { isActive: true, OR: [{ inventory: { quantity: { gt: 0 } } }, { inventory: { allowBackorder: true } }] } } });
  if (params.moqMax) and.push({ variants: { some: { isDefault: true, moq: { lte: params.moqMax } } } });
  if (params.packagings.length) and.push({ variants: { some: { packagingLabel: { in: params.packagings } } } });
  if (params.units.length) and.push({ variants: { some: { unitLabel: { in: params.units } } } });
  if (!opts.excludeAttrs) {
    for (const [code, values] of Object.entries(params.attrs)) {
      and.push({ attributes: { some: { attribute: { code }, value: { in: values } } } });
    }
  }
  return { AND: and };
}

async function buildFacets(scope: ListingScope, params: ListingParams, where: Prisma.ProductWhereInput): Promise<ListingFacets> {
  const [brandWhere, attrWhere, priceWhere] = await Promise.all([
    buildWhere(scope, params, { excludeBrands: true }),
    buildWhere(scope, params, { excludeAttrs: true }),
    buildWhere(scope, params, { excludePrice: true }),
  ]);
  const [brandGroups, brands, priceAgg, variantRows, attrDefs, inStockCount, promoIds, settings] = await Promise.all([
    db.product.groupBy({ by: ["brandId"], where: brandWhere, _count: { _all: true } }),
    getBrands(),
    db.product.aggregate({ where: priceWhere, _min: { priceFrom: true }, _max: { priceFrom: true } }),
    db.productVariant.findMany({ where: { isActive: true, product: where }, select: { packagingLabel: true, unitLabel: true } }),
    scope.categoryId ? getCategoryFilterAttributes(scope.categoryId) : Promise.resolve([]),
    db.product.count({ where: { AND: [where, { variants: { some: { OR: [{ inventory: { quantity: { gt: 0 } } }, { inventory: { allowBackorder: true } }] } } }] } }),
    getPromotedProductIds(),
    getSettings(),
  ]);

  const brandMap = new Map(brands.map((b) => [b.id, b]));
  const brandFacets: FacetValue[] = brandGroups
    .filter((g) => g.brandId && brandMap.has(g.brandId))
    .map((g) => ({ value: brandMap.get(g.brandId!)!.slug, label: brandMap.get(g.brandId!)!.name, count: g._count._all }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const count = (rows: (string | null)[]): FacetValue[] => {
    const m = new Map<string, number>();
    for (const r of rows) if (r) m.set(r, (m.get(r) ?? 0) + 1);
    return [...m.entries()].map(([value, c]) => ({ value, label: value, count: c })).sort((a, b) => b.count - a.count).slice(0, 12);
  };

  let attributes: AttributeFacet[] = [];
  if (attrDefs.length) {
    const scopedIds = (await db.product.findMany({ where: attrWhere, select: { id: true } })).map((p) => p.id);
    const values = await db.productAttributeValue.groupBy({
      by: ["attributeId", "value"],
      where: { productId: { in: scopedIds }, attributeId: { in: attrDefs.map((a) => a.id) } },
      _count: { _all: true },
    });
    attributes = attrDefs
      .map((def) => ({
        code: def.code,
        name: def.name,
        unit: def.unit,
        values: values
          .filter((v) => v.attributeId === def.id)
          .map((v) => ({ value: v.value, label: def.unit ? `${v.value} ${def.unit}` : v.value, count: v._count._all }))
          .sort((a, b) => (Number(a.value) || 0) - (Number(b.value) || 0) || a.label.localeCompare(b.label))
          .slice(0, 20),
      }))
      .filter((a) => a.values.length > 1 || (a.values.length === 1 && params.attrs[a.code]));
  }

  const newSince = new Date(Date.now() - settings.newProductDays * 86_400_000);
  const [newCount, promoCount] = await Promise.all([
    db.product.count({ where: { AND: [where, { publishedAt: { gte: newSince } }] } }),
    promoIds.length ? db.product.count({ where: { AND: [where, { id: { in: promoIds } }] } }) : Promise.resolve(0),
  ]);

  return {
    brands: brandFacets,
    priceRange: priceAgg._min.priceFrom !== null && priceAgg._max.priceFrom !== null ? { min: priceAgg._min.priceFrom, max: priceAgg._max.priceFrom } : null,
    attributes,
    packagings: count(variantRows.map((v) => v.packagingLabel)),
    units: count(variantRows.map((v) => v.unitLabel)),
    inStockCount,
    promoCount,
    newCount,
  };
}

/** Listing paginé avec facettes. */
export async function listProducts(scope: ListingScope, params: ListingParams, ctx: PricingContext, options: { pageSize?: number; facets?: boolean } = {}): Promise<ListingResult> {
  const pageSize = options.pageSize ?? siteConfig.pageSize;
  const where = await buildWhere(scope, params);
  const useRelevance = params.sort === "relevance" && scope.ids && scope.ids.length > 0;
  const [total, rows, facets] = await Promise.all([
    db.product.count({ where }),
    useRelevance
      ? db.product.findMany({ where, include: productCardInclude(ctx) })
      : db.product.findMany({ where, include: productCardInclude(ctx), orderBy: orderBy(params.sort), skip: (params.page - 1) * pageSize, take: pageSize }),
    options.facets === false ? Promise.resolve(emptyFacets()) : buildFacets(scope, params, where),
  ]);
  let pageRows = rows;
  if (useRelevance) {
    const rank = new Map(scope.ids!.map((id, i) => [id, i]));
    pageRows = [...rows].sort((a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9)).slice((params.page - 1) * pageSize, params.page * pageSize);
  }
  const items = await toProductCards(pageRows, ctx);
  return { items, total, page: params.page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), facets };
}

export function emptyFacets(): ListingFacets {
  return { brands: [], priceRange: null, attributes: [], packagings: [], units: [], inStockCount: 0, promoCount: 0, newCount: 0 };
}

/** Sélections simples (accueil, PDP, secteurs). */
export async function getProductsByIds(ids: string[], ctx: PricingContext): Promise<ProductCardData[]> {
  if (!ids.length) return [];
  const rows = await db.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, include: productCardInclude(ctx) });
  const rank = new Map(ids.map((id, i) => [id, i]));
  rows.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  return toProductCards(rows, ctx);
}

export async function getProductsBySkus(skus: string[], ctx: PricingContext): Promise<ProductCardData[]> {
  if (!skus.length) return [];
  const rows = await db.product.findMany({ where: { status: "ACTIVE", OR: [{ sku: { in: skus } }, { variants: { some: { sku: { in: skus } } } }] }, include: productCardInclude(ctx) });
  return toProductCards(rows, ctx);
}

export async function getBestsellers(ctx: PricingContext, limit = 8, categoryIds?: string[]): Promise<ProductCardData[]> {
  const rows = await db.product.findMany({
    where: { status: "ACTIVE", ...(categoryIds?.length ? { categoryId: { in: categoryIds } } : {}) },
    include: productCardInclude(ctx),
    orderBy: [{ salesCount: "desc" }, { viewCount: "desc" }],
    take: limit,
  });
  return toProductCards(rows, ctx);
}

export async function getNewArrivals(ctx: PricingContext, limit = 8): Promise<ProductCardData[]> {
  const rows = await db.product.findMany({ where: { status: "ACTIVE", publishedAt: { not: null } }, include: productCardInclude(ctx), orderBy: [{ publishedAt: "desc" }], take: limit });
  return toProductCards(rows, ctx);
}

export async function getPromotedProducts(ctx: PricingContext, limit = 8): Promise<ProductCardData[]> {
  const ids = await getPromotedProductIds();
  if (!ids.length) return [];
  const rows = await db.product.findMany({ where: { status: "ACTIVE", id: { in: ids } }, include: productCardInclude(ctx), orderBy: [{ salesCount: "desc" }], take: limit });
  return toProductCards(rows, ctx);
}

export async function getProductsInCategories(categoryIds: string[], ctx: PricingContext, limit = 8): Promise<ProductCardData[]> {
  if (!categoryIds.length) return [];
  const all = (await Promise.all(categoryIds.map((id) => getCategoryDescendantIds(id)))).flat();
  const rows = await db.product.findMany({ where: { status: "ACTIVE", categoryId: { in: all } }, include: productCardInclude(ctx), orderBy: [{ salesCount: "desc" }], take: limit });
  return toProductCards(rows, ctx);
}

/** Recalcule `priceFrom` pour un produit (après modification des variantes). */
export async function refreshProductPriceFrom(productId: string) {
  const agg = await db.productVariant.aggregate({ where: { productId, isActive: true }, _min: { basePrice: true } });
  await db.product.update({ where: { id: productId }, data: { priceFrom: agg._min.basePrice ?? 0 } });
}
