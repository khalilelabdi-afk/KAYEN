import { parseMoneyInput, toMoneyInput } from "@/lib/money";
import type { ProductPayload } from "@/app/actions/admin/catalog";

/** Types partagés du formulaire produit (état client en chaînes, converti en payload typé à l'envoi). */
export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const DOCUMENT_TYPES = ["DATASHEET", "SAFETY_SHEET", "MANUAL", "CERTIFICATE", "OTHER"] as const;
export const RELATION_TYPES = ["SIMILAR", "FREQUENTLY_BOUGHT", "COMPLEMENTARY", "ACCESSORY"] as const;

export interface ProductRefs {
  categories: { id: string; name: string; level: number; path: string }[];
  brands: { id: string; name: string }[];
  taxClasses: { id: string; name: string; rateBps: number }[];
  attributes: { id: string; code: string; name: string; type: string; unit: string | null }[];
}

export interface VariantState {
  key: string;
  sku: string; ean: string; name: string; isDefault: boolean; isActive: boolean;
  basePrice: string; compareAtPrice: string; costPrice: string;
  moq: string; orderMultiple: string; unitLabel: string; packagingLabel: string; unitsPerPack: string; quoteOnlyAbove: string; leadTimeDays: string;
  weightGrams: string; lengthMm: string; widthMm: string; heightMm: string;
  options: Record<string, string>;
  tiers: { key: string; minQuantity: string; unitPrice: string }[];
  stock: { quantity: string; lowStockThreshold: string; allowBackorder: boolean };
}

export interface ProductFormState {
  id?: string;
  name: string; slug: string; slugTouched: boolean; sku: string; brandId: string; categoryId: string; taxClassId: string; status: (typeof PRODUCT_STATUSES)[number];
  hasVariants: boolean; requiresAccount: boolean;
  shortDescription: string; description: string; usageTips: string; shippingInfo: string; keywords: string; videoUrl: string; seoTitle: string; seoDescription: string;
  options: { key: string; name: string; values: string }[];
  images: { key: string; id?: string; url: string; alt: string; isPrimary: boolean }[];
  variants: VariantState[];
  attributes: { key: string; attributeId: string; value: string }[];
  documents: { key: string; type: (typeof DOCUMENT_TYPES)[number]; name: string; url: string }[];
  faqs: { key: string; question: string; answer: string }[];
  related: { targetId: string; sku: string; name: string; type: (typeof RELATION_TYPES)[number] }[];
}

let seq = 0;
export const newKey = () => `k${Date.now().toString(36)}${(seq++).toString(36)}`;
const str = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));
const money = (v: number | null | undefined) => (v === null || v === undefined ? "" : toMoneyInput(v));

export function emptyVariant(sku = "", defaults?: Partial<VariantState>): VariantState {
  return { key: newKey(), sku, ean: "", name: "", isDefault: false, isActive: true, basePrice: "", compareAtPrice: "", costPrice: "", moq: "1", orderMultiple: "1", unitLabel: "unité", packagingLabel: "", unitsPerPack: "", quoteOnlyAbove: "", leadTimeDays: "", weightGrams: "", lengthMm: "", widthMm: "", heightMm: "", options: {}, tiers: [], stock: { quantity: "0", lowStockThreshold: "10", allowBackorder: false }, ...defaults };
}

export function emptyProduct(): ProductFormState {
  return { name: "", slug: "", slugTouched: false, sku: "", brandId: "", categoryId: "", taxClassId: "", status: "DRAFT", hasVariants: false, requiresAccount: false, shortDescription: "", description: "", usageTips: "", shippingInfo: "", keywords: "", videoUrl: "", seoTitle: "", seoDescription: "", options: [], images: [], variants: [emptyVariant("", { isDefault: true })], attributes: [], documents: [], faqs: [], related: [] };
}

/** Sous-ensemble structurel d'un produit Prisma (évite d'importer Prisma côté client). */
export interface ProductRowLike {
  id: string; name: string; slug: string; sku: string; brandId: string | null; categoryId: string; taxClassId: string | null; status: string; hasVariants: boolean; requiresAccount: boolean;
  shortDescription: string | null; description: string | null; usageTips: string | null; shippingInfo: string | null; keywords: string[]; videoUrl: string | null; seoTitle: string | null; seoDescription: string | null;
  options: { id: string; name: string; sortOrder: number }[];
  images: { id: string; url: string; alt: string; isPrimary: boolean; sortOrder: number }[];
  variants: {
    sku: string; ean: string | null; name: string | null; isDefault: boolean; isActive: boolean; position: number; basePrice: number; compareAtPrice: number | null; costPrice: number | null; moq: number; orderMultiple: number; unitLabel: string; packagingLabel: string | null;
    unitsPerPack: number | null; quoteOnlyAbove: number | null; leadTimeDays: number | null; weightGrams: number | null; lengthMm: number | null; widthMm: number | null; heightMm: number | null;
    optionValues: { optionId: string; value: string }[];
    priceTiers: { minQuantity: number; unitPrice: number }[];
    inventory: { quantity: number; lowStockThreshold: number; allowBackorder: boolean } | null;
  }[];
  attributes: { attributeId: string; value: string }[];
  documents: { type: string; name: string; url: string; sortOrder: number }[];
  faqs: { question: string; answer: string; sortOrder: number }[];
  relations: { targetId: string; type: string; target: { sku: string; name: string } }[];
}

export function productToFormState(p: ProductRowLike): ProductFormState {
  const options = [...p.options].sort((a, b) => a.sortOrder - b.sortOrder);
  const optionName = new Map(options.map((o) => [o.id, o.name]));
  const variants = [...p.variants].sort((a, b) => a.position - b.position);
  return {
    id: p.id, name: p.name, slug: p.slug, slugTouched: true, sku: p.sku, brandId: p.brandId ?? "", categoryId: p.categoryId, taxClassId: p.taxClassId ?? "", status: PRODUCT_STATUSES.includes(p.status as "DRAFT") ? (p.status as "DRAFT") : "DRAFT",
    hasVariants: p.hasVariants, requiresAccount: p.requiresAccount, shortDescription: p.shortDescription ?? "", description: p.description ?? "", usageTips: p.usageTips ?? "", shippingInfo: p.shippingInfo ?? "", keywords: p.keywords.join(", "), videoUrl: p.videoUrl ?? "", seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "",
    options: options.map((o) => ({ key: newKey(), name: o.name, values: [...new Set(variants.flatMap((v) => v.optionValues.filter((ov) => ov.optionId === o.id).map((ov) => ov.value)))].join(", ") })),
    images: [...p.images].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => ({ key: newKey(), id: i.id, url: i.url, alt: i.alt, isPrimary: i.isPrimary })),
    variants: variants.map((v) => ({
      key: newKey(), sku: v.sku, ean: v.ean ?? "", name: v.name ?? "", isDefault: v.isDefault, isActive: v.isActive, basePrice: money(v.basePrice), compareAtPrice: money(v.compareAtPrice), costPrice: money(v.costPrice), moq: str(v.moq), orderMultiple: str(v.orderMultiple), unitLabel: v.unitLabel, packagingLabel: v.packagingLabel ?? "",
      unitsPerPack: str(v.unitsPerPack), quoteOnlyAbove: str(v.quoteOnlyAbove), leadTimeDays: str(v.leadTimeDays), weightGrams: str(v.weightGrams), lengthMm: str(v.lengthMm), widthMm: str(v.widthMm), heightMm: str(v.heightMm),
      options: Object.fromEntries(v.optionValues.filter((ov) => optionName.has(ov.optionId)).map((ov) => [optionName.get(ov.optionId)!, ov.value])),
      tiers: [...v.priceTiers].sort((a, b) => a.minQuantity - b.minQuantity).map((tr) => ({ key: newKey(), minQuantity: str(tr.minQuantity), unitPrice: money(tr.unitPrice) })),
      stock: { quantity: str(v.inventory?.quantity ?? 0), lowStockThreshold: str(v.inventory?.lowStockThreshold ?? 10), allowBackorder: v.inventory?.allowBackorder ?? false },
    })),
    attributes: p.attributes.map((a) => ({ key: newKey(), attributeId: a.attributeId, value: a.value })),
    documents: [...p.documents].sort((a, b) => a.sortOrder - b.sortOrder).map((d) => ({ key: newKey(), type: DOCUMENT_TYPES.includes(d.type as "OTHER") ? (d.type as "OTHER") : "OTHER", name: d.name, url: d.url })),
    faqs: [...p.faqs].sort((a, b) => a.sortOrder - b.sortOrder).map((f) => ({ key: newKey(), question: f.question, answer: f.answer })),
    related: p.relations.map((r) => ({ targetId: r.targetId, sku: r.target.sku, name: r.target.name, type: RELATION_TYPES.includes(r.type as "SIMILAR") ? (r.type as "SIMILAR") : "SIMILAR" })),
  };
}

const intOrNull = (v: string, fallback: number | null = null) => { const n = Number.parseInt(v.trim(), 10); return Number.isFinite(n) ? n : fallback; };
const moneyOrNull = (v: string) => (v.trim() ? parseMoneyInput(v) : null);

/** Convertit l'état du formulaire en payload serveur. Retourne les chemins invalides détectés côté client. */
export function formStateToPayload(f: ProductFormState): { payload: ProductPayload; invalid: string[] } {
  const invalid: string[] = [];
  const variants = f.variants.map((v, i) => {
    const basePrice = parseMoneyInput(v.basePrice);
    if (basePrice === null) invalid.push(`variants.${i}.basePrice`);
    if (!v.sku.trim()) invalid.push(`variants.${i}.sku`);
    const compareAtPrice = moneyOrNull(v.compareAtPrice);
    if (v.compareAtPrice.trim() && compareAtPrice === null) invalid.push(`variants.${i}.compareAtPrice`);
    const costPrice = moneyOrNull(v.costPrice);
    if (v.costPrice.trim() && costPrice === null) invalid.push(`variants.${i}.costPrice`);
    const tiers = v.tiers.map((tr, j) => { const unitPrice = parseMoneyInput(tr.unitPrice); const minQuantity = intOrNull(tr.minQuantity, 0) ?? 0; if (unitPrice === null || minQuantity < 1) invalid.push(`variants.${i}.tiers.${j}`); return { minQuantity, unitPrice: unitPrice ?? 0 }; });
    return {
      sku: v.sku.trim(), ean: v.ean.trim(), name: v.name.trim(), isDefault: v.isDefault, isActive: v.isActive, basePrice: basePrice ?? 0, compareAtPrice, costPrice,
      moq: intOrNull(v.moq, 1) ?? 1, orderMultiple: intOrNull(v.orderMultiple, 1) ?? 1, unitLabel: v.unitLabel.trim() || "unité", packagingLabel: v.packagingLabel.trim(), unitsPerPack: intOrNull(v.unitsPerPack), quoteOnlyAbove: intOrNull(v.quoteOnlyAbove), leadTimeDays: intOrNull(v.leadTimeDays),
      weightGrams: intOrNull(v.weightGrams), lengthMm: intOrNull(v.lengthMm), widthMm: intOrNull(v.widthMm), heightMm: intOrNull(v.heightMm), options: v.options, tiers,
      stock: { quantity: Math.max(0, intOrNull(v.stock.quantity, 0) ?? 0), lowStockThreshold: Math.max(0, intOrNull(v.stock.lowStockThreshold, 10) ?? 10), allowBackorder: v.stock.allowBackorder },
    };
  });
  if (!f.name.trim()) invalid.push("name");
  if (!f.slug.trim()) invalid.push("slug");
  if (!f.sku.trim()) invalid.push("sku");
  if (!f.categoryId) invalid.push("categoryId");
  const payload: ProductPayload = {
    id: f.id, name: f.name.trim(), slug: f.slug.trim(), sku: f.sku.trim(), brandId: f.brandId || null, categoryId: f.categoryId, taxClassId: f.taxClassId || null, status: f.status, hasVariants: f.hasVariants, requiresAccount: f.requiresAccount,
    shortDescription: f.shortDescription, description: f.description, usageTips: f.usageTips, shippingInfo: f.shippingInfo, keywords: f.keywords.split(",").map((k) => k.trim()).filter(Boolean), videoUrl: f.videoUrl.trim(), seoTitle: f.seoTitle, seoDescription: f.seoDescription,
    options: f.hasVariants ? f.options.filter((o) => o.name.trim()).map((o) => ({ name: o.name.trim(), values: o.values.split(",").map((v) => v.trim()).filter(Boolean) })) : [],
    images: f.images.filter((i) => i.url.trim()).map((i, idx) => ({ id: i.id, url: i.url.trim(), alt: i.alt.trim(), isPrimary: i.isPrimary, sortOrder: idx })),
    variants,
    attributes: f.attributes.filter((a) => a.attributeId && a.value.trim()).map((a) => ({ attributeId: a.attributeId, value: a.value.trim() })),
    documents: f.documents.filter((d) => d.name.trim() && d.url.trim()).map((d) => ({ type: d.type, name: d.name.trim(), url: d.url.trim() })),
    faqs: f.faqs.filter((q) => q.question.trim() && q.answer.trim()).map((q) => ({ question: q.question.trim(), answer: q.answer.trim() })),
    related: f.related.map((r) => ({ targetId: r.targetId, type: r.type })),
  };
  return { payload, invalid };
}

/** Props communes aux panneaux du formulaire. */
export interface PanelProps {
  form: ProductFormState;
  update: (patch: Partial<ProductFormState>) => void;
  refs: ProductRefs;
  errors: Record<string, string[]>;
}
