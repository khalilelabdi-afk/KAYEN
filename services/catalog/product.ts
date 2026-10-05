import "server-only";
import { cache } from "react";
import { db, type Prisma } from "@/lib/db";
import type { PricingContext } from "@/lib/pricing/types";
import { calculateUnitPrice, buildTierTable } from "@/lib/pricing/engine";
import type { ProductCardData } from "@/types/catalog";
import { buildPricingInput, getActivePromotions, getAvailability, variantPricingInclude } from "@/services/pricing";
import { getCategoryBreadcrumb } from "./categories";
import { getProductsByIds, toProductCards, productCardInclude } from "./products";
import type { VariantPricingInput, TierTableRow, UnitPriceResult } from "@/lib/pricing/types";

export function productDetailInclude(ctx: PricingContext) {
  return {
    brand: true,
    category: true,
    taxClass: true,
    images: { orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }] },
    options: { orderBy: { sortOrder: "asc" as const } },
    variants: {
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" as const }, { position: "asc" as const }],
      include: { ...variantPricingInclude(ctx), optionValues: { include: { option: true } } },
    },
    attributes: { include: { attribute: true }, orderBy: { attribute: { sortOrder: "asc" as const } } },
    documents: { orderBy: { sortOrder: "asc" as const } },
    faqs: { orderBy: { sortOrder: "asc" as const } },
    relations: { orderBy: { sortOrder: "asc" as const }, select: { targetId: true, type: true } },
  } satisfies Prisma.ProductInclude;
}

export type ProductDetailRow = Prisma.ProductGetPayload<{ include: ReturnType<typeof productDetailInclude> }>;

/** Données sérialisables d'une variante pour le client (prix calculés côté client via le moteur pur). */
export interface VariantView {
  id: string;
  sku: string;
  ean: string | null;
  name: string | null;
  isDefault: boolean;
  options: Record<string, string>;
  unitLabel: string;
  packagingLabel: string | null;
  unitsPerPack: number | null;
  moq: number;
  orderMultiple: number;
  leadTimeDays: number | null;
  weightGrams: number | null;
  dimensionsMm: [number, number, number] | null;
  imageId: string | null;
  availability: { status: "in_stock" | "low_stock" | "backorder" | "out_of_stock"; available: number; allowBackorder: boolean; restockAt: string | null };
  pricing: VariantPricingInput;
  /** Prix au MOQ pré-calculé côté serveur (affichage initial / SEO). */
  initial: UnitPriceResult;
  tierTable: TierTableRow[];
}

export interface ProductDetail {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  usageTips: string | null;
  shippingInfo: string | null;
  videoUrl: string | null;
  requiresAccount: boolean;
  hasVariants: boolean;
  brand: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; path: string };
  breadcrumb: { label: string; href: string }[];
  images: { id: string; url: string; alt: string; width: number; height: number; variantId: string | null }[];
  options: { id: string; name: string; values: string[] }[];
  variants: VariantView[];
  attributes: { code: string; name: string; value: string; unit: string | null }[];
  documents: { id: string; type: string; name: string; url: string }[];
  faqs: { id: string; question: string; answer: string }[];
  salesCount: number;
  ratingAvg: number | null;
  ratingCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  updatedAt: string;
  taxRateBps: number;
}

const loadProduct = cache(async (slug: string, ctx: PricingContext) =>
  db.product.findFirst({ where: { slug, status: { in: ["ACTIVE", "ARCHIVED"] } }, include: productDetailInclude(ctx) }),
);

export async function getProductDetail(slug: string, ctx: PricingContext): Promise<{ product: ProductDetail | null; archived: boolean; categoryHref: string | null }> {
  const row = await loadProduct(slug, ctx);
  if (!row) return { product: null, archived: false, categoryHref: null };
  const breadcrumbNodes = await getCategoryBreadcrumb(row.categoryId);
  const categoryHref = breadcrumbNodes.at(-1)?.href ?? null;
  if (row.status === "ARCHIVED" || row.variants.length === 0) return { product: null, archived: true, categoryHref };

  const promotions = await getActivePromotions();
  const variants: VariantView[] = await Promise.all(
    row.variants.map(async (v) => {
      const pricing = await buildPricingInput(v);
      const availability = getAvailability(v);
      return {
        id: v.id,
        sku: v.sku,
        ean: v.ean,
        name: v.name,
        isDefault: v.isDefault,
        options: Object.fromEntries(v.optionValues.map((ov) => [ov.option.name, ov.value])),
        unitLabel: v.unitLabel,
        packagingLabel: v.packagingLabel,
        unitsPerPack: v.unitsPerPack,
        moq: v.moq,
        orderMultiple: v.orderMultiple,
        leadTimeDays: v.leadTimeDays,
        weightGrams: v.weightGrams,
        dimensionsMm: v.lengthMm && v.widthMm && v.heightMm ? [v.lengthMm, v.widthMm, v.heightMm] : null,
        imageId: v.imageId,
        availability: { status: availability.status, available: availability.available, allowBackorder: availability.allowBackorder, restockAt: availability.restockAt?.toISOString() ?? null },
        pricing,
        initial: calculateUnitPrice(pricing, v.moq, ctx, promotions),
        tierTable: buildTierTable(pricing, v.moq, ctx, promotions),
      };
    }),
  );

  const product: ProductDetail = {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    shortDescription: row.shortDescription,
    description: row.description,
    usageTips: row.usageTips,
    shippingInfo: row.shippingInfo,
    videoUrl: row.videoUrl,
    requiresAccount: row.requiresAccount,
    hasVariants: row.hasVariants,
    brand: row.brand ? { id: row.brand.id, name: row.brand.name, slug: row.brand.slug } : null,
    category: { id: row.category.id, name: row.category.name, path: row.category.path },
    breadcrumb: breadcrumbNodes.map((n) => ({ label: n.name, href: n.href })),
    images: row.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, width: i.width, height: i.height, variantId: i.variantId })),
    options: row.options.map((o) => ({
      id: o.id,
      name: o.name,
      values: [...new Set(row.variants.flatMap((v) => v.optionValues.filter((ov) => ov.optionId === o.id).map((ov) => ov.value)))],
    })),
    variants,
    attributes: row.attributes.map((a) => ({ code: a.attribute.code, name: a.attribute.name, value: a.value, unit: a.attribute.unit })),
    documents: row.documents.map((d) => ({ id: d.id, type: d.type, name: d.name, url: d.url })),
    faqs: row.faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
    salesCount: row.salesCount,
    ratingAvg: row.ratingAvg ? Number(row.ratingAvg) : null,
    ratingCount: row.ratingCount,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    taxRateBps: variants[0]?.pricing.taxRateBps ?? 0,
  };
  return { product, archived: false, categoryHref };
}

export interface RelatedProducts {
  frequentlyBought: ProductCardData[];
  similar: ProductCardData[];
  complementary: ProductCardData[];
  alsoBuy: ProductCardData[];
}

/** Produits associés : relations explicites, complétées par la catégorie. */
export async function getRelatedProducts(productId: string, categoryId: string, ctx: PricingContext): Promise<RelatedProducts> {
  const relations = await db.productRelation.findMany({ where: { sourceId: productId }, orderBy: { sortOrder: "asc" } });
  const pick = (type: string) => relations.filter((r) => r.type === type).map((r) => r.targetId);
  const explicitIds = [...new Set(relations.map((r) => r.targetId))];
  const [frequentlyBought, similarExplicit, complementary, accessories] = await Promise.all([
    getProductsByIds(pick("FREQUENTLY_BOUGHT").slice(0, 4), ctx),
    getProductsByIds(pick("SIMILAR").slice(0, 8), ctx),
    getProductsByIds([...pick("COMPLEMENTARY"), ...pick("ACCESSORY")].slice(0, 8), ctx),
    Promise.resolve([] as ProductCardData[]),
  ]);
  void accessories;
  let similar = similarExplicit;
  if (similar.length < 4) {
    const fill = await db.product.findMany({
      where: { status: "ACTIVE", categoryId, id: { notIn: [productId, ...explicitIds] } },
      include: productCardInclude(ctx),
      orderBy: [{ salesCount: "desc" }],
      take: 8 - similar.length,
    });
    similar = [...similar, ...(await toProductCards(fill, ctx))];
  }
  const alsoBuyRows = await db.product.findMany({
    where: { status: "ACTIVE", id: { notIn: [productId, ...explicitIds, ...similar.map((s) => s.id)] }, category: { path: { startsWith: (await db.category.findUnique({ where: { id: categoryId }, select: { path: true } }))?.path.split("/")[0] ?? "" } } },
    include: productCardInclude(ctx),
    orderBy: [{ salesCount: "desc" }],
    take: 4,
  });
  const alsoBuy = await toProductCards(alsoBuyRows, ctx);
  return { frequentlyBought, similar, complementary, alsoBuy };
}

/** Incrémente le compteur de vues (appelé hors rendu, via after()). */
export async function incrementViewCount(productId: string) {
  await db.product.update({ where: { id: productId }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
}
