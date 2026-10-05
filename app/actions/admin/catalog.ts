"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { requireStaff, type ActionResult } from "@/lib/auth/dal";
import { refreshProductPriceFrom } from "@/services/catalog/products";
import { idSchema, moneySchema, quantitySchema, optionalText, slugSchema, fieldErrors } from "@/lib/validation/common";

async function audit(userId: string, action: string, entityType: string, entityId: string, before?: unknown, after?: unknown) {
  await db.auditLog.create({ data: { userId, action, entityType, entityId, before: before as Prisma.InputJsonValue, after: after as Prisma.InputJsonValue } });
}

function revalidateCatalog(paths: string[] = []) {
  for (const tag of ["products", "categories", "brands", "search"]) revalidateTag(tag, "max");
  for (const p of ["/admin/products", "/admin/inventory", "/admin/categories", "/admin/brands", ...paths]) revalidatePath(p);
}

/** Trouve une valeur libre : base, base-2, base-3… */
async function freeValue(base: string, exists: (v: string) => Promise<boolean>) {
  let candidate = base;
  for (let i = 2; await exists(candidate); i++) candidate = `${base}-${i}`;
  return candidate;
}

// ── Produits ───────────────────────────────────────────────────────────────
const DOCUMENT_TYPES = ["DATASHEET", "SAFETY_SHEET", "MANUAL", "CERTIFICATE", "OTHER"] as const;
const RELATION_TYPES = ["SIMILAR", "FREQUENTLY_BOUGHT", "COMPLEMENTARY", "ACCESSORY"] as const;
const nullableInt = (min: number) => z.number().int().min(min).max(100_000_000).nullable();

const variantSchema = z.object({
  sku: z.string().trim().min(1).max(64),
  ean: optionalText(32),
  name: optionalText(120),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  basePrice: moneySchema,
  compareAtPrice: moneySchema.nullable(),
  costPrice: moneySchema.nullable(),
  moq: quantitySchema,
  orderMultiple: quantitySchema,
  unitLabel: z.string().trim().min(1).max(40),
  packagingLabel: optionalText(80),
  unitsPerPack: nullableInt(1),
  quoteOnlyAbove: nullableInt(1),
  leadTimeDays: nullableInt(0),
  weightGrams: nullableInt(0),
  lengthMm: nullableInt(0),
  widthMm: nullableInt(0),
  heightMm: nullableInt(0),
  options: z.record(z.string().max(60), z.string().trim().max(60)),
  tiers: z.array(z.object({ minQuantity: quantitySchema, unitPrice: moneySchema })).max(20),
  stock: z.object({ quantity: z.number().int().min(0).max(100_000_000), lowStockThreshold: z.number().int().min(0).max(100_000_000), allowBackorder: z.boolean() }),
});

const productSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().trim().min(2).max(200),
  slug: slugSchema,
  sku: z.string().trim().min(1).max(64),
  brandId: z.string().max(64).nullable(),
  categoryId: idSchema,
  taxClassId: z.string().max(64).nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  hasVariants: z.boolean(),
  requiresAccount: z.boolean(),
  shortDescription: optionalText(500),
  description: optionalText(20000),
  usageTips: optionalText(5000),
  shippingInfo: optionalText(2000),
  keywords: z.array(z.string().trim().min(1).max(60)).max(50),
  videoUrl: z.string().trim().url().max(500).or(z.literal("")),
  seoTitle: optionalText(160),
  seoDescription: optionalText(320),
  options: z.array(z.object({ name: z.string().trim().min(1).max(60), values: z.array(z.string().trim().min(1).max(60)).max(50) })).max(5),
  images: z.array(z.object({ id: z.string().max(64).optional(), url: z.string().trim().min(1).max(500), alt: z.string().trim().max(200), isPrimary: z.boolean(), sortOrder: z.number().int().min(0) })).max(20),
  variants: z.array(variantSchema).min(1).max(100),
  attributes: z.array(z.object({ attributeId: idSchema, value: z.string().trim().min(1).max(200) })).max(50),
  documents: z.array(z.object({ type: z.enum(DOCUMENT_TYPES), name: z.string().trim().min(1).max(120), url: z.string().trim().min(1).max(500) })).max(20),
  faqs: z.array(z.object({ question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(2000) })).max(20),
  related: z.array(z.object({ targetId: idSchema, type: z.enum(RELATION_TYPES) })).max(30),
});
export type ProductPayload = z.infer<typeof productSchema>;

/** Enregistre un produit complet (variantes, paliers, stock, images, attributs, documents, FAQ, relations) en une transaction. */
export async function productSaveAction(input: ProductPayload): Promise<ActionResult<{ id: string; slug: string }>> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    const fe = fieldErrors(parsed.error);
    return { ok: false, error: t("admin.products.form.invalidFields", { fields: Object.keys(fe).slice(0, 6).join(", ") }), fieldErrors: fe };
  }
  const p = parsed.data;
  const skus = p.variants.map((v) => v.sku.toLowerCase());
  const dup = p.variants.find((v, i) => skus.indexOf(v.sku.toLowerCase()) !== i);
  if (dup) return { ok: false, error: t("admin.products.form.duplicateVariantSku", { sku: dup.sku }), fieldErrors: { variants: [dup.sku] } };
  const notSelf = p.id ? { id: { not: p.id } } : {};
  const [slugConflict, skuConflict, variantConflict, existing] = await Promise.all([
    db.product.findFirst({ where: { slug: p.slug, ...notSelf }, select: { id: true } }),
    db.product.findFirst({ where: { sku: { equals: p.sku, mode: "insensitive" }, ...notSelf }, select: { id: true } }),
    db.productVariant.findFirst({ where: { sku: { in: p.variants.map((v) => v.sku), mode: "insensitive" }, ...(p.id ? { productId: { not: p.id } } : {}) }, select: { sku: true } }),
    p.id ? db.product.findUnique({ where: { id: p.id }, include: { variants: { include: { inventory: true, _count: { select: { orderItems: true, cartItems: true } } } }, images: { select: { id: true } } } }) : Promise.resolve(null),
  ]);
  if (p.id && !existing) return { ok: false, error: t("common.errors.notFound") };
  if (slugConflict) return { ok: false, error: t("admin.products.form.slugTaken"), fieldErrors: { slug: ["taken"] } };
  if (skuConflict) return { ok: false, error: t("admin.products.form.skuTaken"), fieldErrors: { sku: ["taken"] } };
  if (variantConflict) return { ok: false, error: t("admin.products.form.variantSkuTaken", { sku: variantConflict.sku }), fieldErrors: { variants: [variantConflict.sku] } };

  const defaultIdx = Math.max(0, p.variants.findIndex((v) => v.isDefault));
  const primaryIdx = Math.max(0, p.images.findIndex((i) => i.isPrimary));
  const activePrices = p.variants.filter((v) => v.isActive).map((v) => v.basePrice);
  const productData = {
    name: p.name, slug: p.slug, sku: p.sku, brandId: p.brandId || null, categoryId: p.categoryId, taxClassId: p.taxClassId || null, status: p.status, hasVariants: p.hasVariants, requiresAccount: p.requiresAccount,
    shortDescription: p.shortDescription || null, description: p.description || null, usageTips: p.usageTips || null, shippingInfo: p.shippingInfo || null, keywords: [...new Set(p.keywords)], videoUrl: p.videoUrl || null,
    seoTitle: p.seoTitle || null, seoDescription: p.seoDescription || null, priceFrom: activePrices.length ? Math.min(...activePrices) : (p.variants[0]?.basePrice ?? 0),
    publishedAt: p.status === "ACTIVE" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
  };

  try {
    const product = await db.$transaction(async (tx) => {
      const saved = existing ? await tx.product.update({ where: { id: existing.id }, data: productData }) : await tx.product.create({ data: productData });
      // Options de variantes
      const optionNames = p.hasVariants ? p.options.map((o) => o.name) : [];
      await tx.productOption.deleteMany({ where: { productId: saved.id, name: { notIn: optionNames } } });
      const optionIds = new Map<string, string>();
      for (const [i, o] of p.options.entries()) {
        if (!p.hasVariants) break;
        const row = await tx.productOption.upsert({ where: { productId_name: { productId: saved.id, name: o.name } }, create: { productId: saved.id, name: o.name, sortOrder: i }, update: { sortOrder: i } });
        optionIds.set(o.name, row.id);
      }
      // Variantes (upsert par SKU)
      const bySku = new Map((existing?.variants ?? []).map((v) => [v.sku.toLowerCase(), v]));
      const keptIds = new Set<string>();
      for (const [i, v] of p.variants.entries()) {
        const prev = bySku.get(v.sku.toLowerCase());
        const data = {
          name: v.name || null, ean: v.ean || null, isDefault: i === defaultIdx, isActive: v.isActive, position: i, basePrice: v.basePrice, compareAtPrice: v.compareAtPrice, costPrice: v.costPrice, moq: v.moq, orderMultiple: v.orderMultiple,
          unitLabel: v.unitLabel, packagingLabel: v.packagingLabel || null, unitsPerPack: v.unitsPerPack, quoteOnlyAbove: v.quoteOnlyAbove, leadTimeDays: v.leadTimeDays, weightGrams: v.weightGrams, lengthMm: v.lengthMm, widthMm: v.widthMm, heightMm: v.heightMm,
        };
        const row = prev ? await tx.productVariant.update({ where: { id: prev.id }, data }) : await tx.productVariant.create({ data: { ...data, sku: v.sku, productId: saved.id } });
        keptIds.add(row.id);
        await tx.priceTier.deleteMany({ where: { variantId: row.id } });
        const tiers = v.tiers.filter((tr, j) => v.tiers.findIndex((x) => x.minQuantity === tr.minQuantity) === j);
        if (tiers.length) await tx.priceTier.createMany({ data: tiers.map((tr) => ({ variantId: row.id, minQuantity: tr.minQuantity, unitPrice: tr.unitPrice })) });
        await tx.variantOptionValue.deleteMany({ where: { variantId: row.id } });
        const values = Object.entries(v.options).filter(([name, value]) => optionIds.has(name) && value.trim()).map(([name, value]) => ({ variantId: row.id, optionId: optionIds.get(name)!, value: value.trim() }));
        if (values.length) await tx.variantOptionValue.createMany({ data: values });
        const prevQty = prev?.inventory?.quantity ?? 0;
        await tx.inventory.upsert({ where: { variantId: row.id }, create: { variantId: row.id, quantity: v.stock.quantity, lowStockThreshold: v.stock.lowStockThreshold, allowBackorder: v.stock.allowBackorder }, update: { quantity: v.stock.quantity, lowStockThreshold: v.stock.lowStockThreshold, allowBackorder: v.stock.allowBackorder } });
        const delta = v.stock.quantity - prevQty;
        if (delta !== 0) await tx.stockMovement.create({ data: { variantId: row.id, type: "ADJUSTMENT", quantity: delta, referenceType: "manual", referenceId: saved.id, userId: user.id } });
      }
      // Variantes retirées : suppression si jamais commandées, sinon désactivation
      for (const old of existing?.variants ?? []) {
        if (keptIds.has(old.id)) continue;
        if (old._count.orderItems || old._count.cartItems) await tx.productVariant.update({ where: { id: old.id }, data: { isActive: false, isDefault: false } });
        else await tx.productVariant.delete({ where: { id: old.id } });
      }
      // Images (ids conservés quand possible)
      const existingImageIds = new Set((existing?.images ?? []).map((i) => i.id));
      const keepImageIds = p.images.map((i) => i.id).filter((id): id is string => !!id && existingImageIds.has(id));
      await tx.productImage.deleteMany({ where: { productId: saved.id, id: { notIn: keepImageIds } } });
      for (const [i, img] of p.images.entries()) {
        const data = { url: img.url, alt: img.alt || p.name, sortOrder: i, isPrimary: i === primaryIdx };
        if (img.id && existingImageIds.has(img.id)) await tx.productImage.update({ where: { id: img.id }, data });
        else await tx.productImage.create({ data: { ...data, productId: saved.id } });
      }
      // Attributs, documents, FAQ, relations
      await tx.productAttributeValue.deleteMany({ where: { productId: saved.id } });
      const attrs = p.attributes.filter((a, j) => p.attributes.findIndex((x) => x.attributeId === a.attributeId) === j);
      if (attrs.length) await tx.productAttributeValue.createMany({ data: attrs.map((a) => ({ productId: saved.id, attributeId: a.attributeId, value: a.value, numericValue: /^-?\d+([.,]\d+)?$/.test(a.value) ? Number(a.value.replace(",", ".")) : null })) });
      await tx.productDocument.deleteMany({ where: { productId: saved.id } });
      if (p.documents.length) await tx.productDocument.createMany({ data: p.documents.map((d, i) => ({ productId: saved.id, type: d.type, name: d.name, url: d.url, sortOrder: i })) });
      await tx.productFaq.deleteMany({ where: { productId: saved.id } });
      if (p.faqs.length) await tx.productFaq.createMany({ data: p.faqs.map((f, i) => ({ productId: saved.id, question: f.question, answer: f.answer, sortOrder: i })) });
      await tx.productRelation.deleteMany({ where: { sourceId: saved.id } });
      const rel = p.related.filter((r) => r.targetId !== saved.id);
      if (rel.length) await tx.productRelation.createMany({ data: rel.map((r, i) => ({ sourceId: saved.id, targetId: r.targetId, type: r.type, sortOrder: i })), skipDuplicates: true });
      return saved;
    }, { timeout: 60_000, maxWait: 10_000 });
    await refreshProductPriceFrom(product.id);
    await audit(user.id, existing ? "product.update" : "product.create", "Product", product.id, existing ? { name: existing.name, status: existing.status, sku: existing.sku, slug: existing.slug } : null, { name: p.name, status: p.status, sku: p.sku, slug: p.slug, variants: p.variants.length });
    revalidateCatalog([`/admin/products/${product.id}`, `/p/${product.slug}`, ...(existing && existing.slug !== product.slug ? [`/p/${existing.slug}`] : [])]);
    return { ok: true, data: { id: product.id, slug: product.slug }, message: t("admin.products.form.saved") };
  } catch (err) {
    console.error("[productSaveAction]", err);
    return { ok: false, error: t("common.errors.generic") };
  }
}

/** Duplique un produit (SKU/slug suffixés -COPIE, brouillon, stock à zéro). */
export async function productDuplicateAction(input: { id: string }): Promise<ActionResult<{ id: string }>> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = z.object({ id: idSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const src = await db.product.findUnique({ where: { id: parsed.data.id }, include: { variants: { include: { priceTiers: true, optionValues: true, inventory: true }, orderBy: { position: "asc" } }, options: true, images: true, attributes: true, documents: true, faqs: true, relations: true } });
  if (!src) return { ok: false, error: t("common.errors.notFound") };
  const sku = await freeValue(`${src.sku}-COPIE`, async (v) => !!(await db.product.findUnique({ where: { sku: v }, select: { id: true } })));
  const slug = await freeValue(`${src.slug}-copie`, async (v) => !!(await db.product.findUnique({ where: { slug: v }, select: { id: true } })));
  const created = await db.$transaction(async (tx) => {
    const product = await tx.product.create({ data: {
      sku, slug, name: t("admin.products.form.copyName", { name: src.name }), shortDescription: src.shortDescription, description: src.description, usageTips: src.usageTips, shippingInfo: src.shippingInfo, status: "DRAFT", publishedAt: null,
      brandId: src.brandId, categoryId: src.categoryId, taxClassId: src.taxClassId, hasVariants: src.hasVariants, requiresAccount: src.requiresAccount, priceFrom: src.priceFrom, videoUrl: src.videoUrl, keywords: src.keywords, seoTitle: src.seoTitle, seoDescription: src.seoDescription,
    } });
    const optionIds = new Map<string, string>();
    for (const o of src.options) optionIds.set(o.id, (await tx.productOption.create({ data: { productId: product.id, name: o.name, sortOrder: o.sortOrder } })).id);
    const imageIds = new Map<string, string>();
    for (const img of src.images) imageIds.set(img.id, (await tx.productImage.create({ data: { productId: product.id, url: img.url, alt: img.alt, width: img.width, height: img.height, sortOrder: img.sortOrder, isPrimary: img.isPrimary } })).id);
    for (const v of src.variants) {
      const vsku = await freeValue(`${v.sku}-COPIE`, async (s) => !!(await tx.productVariant.findUnique({ where: { sku: s }, select: { id: true } })));
      const row = await tx.productVariant.create({ data: {
        productId: product.id, sku: vsku, name: v.name, isDefault: v.isDefault, isActive: v.isActive, position: v.position, basePrice: v.basePrice, compareAtPrice: v.compareAtPrice, costPrice: v.costPrice, moq: v.moq, orderMultiple: v.orderMultiple, unitLabel: v.unitLabel, packagingLabel: v.packagingLabel,
        unitsPerPack: v.unitsPerPack, quoteOnlyAbove: v.quoteOnlyAbove, leadTimeDays: v.leadTimeDays, weightGrams: v.weightGrams, lengthMm: v.lengthMm, widthMm: v.widthMm, heightMm: v.heightMm, imageId: v.imageId ? (imageIds.get(v.imageId) ?? null) : null,
      } });
      if (v.priceTiers.length) await tx.priceTier.createMany({ data: v.priceTiers.map((tr) => ({ variantId: row.id, minQuantity: tr.minQuantity, maxQuantity: tr.maxQuantity, unitPrice: tr.unitPrice })) });
      const ov = v.optionValues.filter((x) => optionIds.has(x.optionId)).map((x) => ({ variantId: row.id, optionId: optionIds.get(x.optionId)!, value: x.value }));
      if (ov.length) await tx.variantOptionValue.createMany({ data: ov });
      await tx.inventory.create({ data: { variantId: row.id, quantity: 0, lowStockThreshold: v.inventory?.lowStockThreshold ?? 10, allowBackorder: v.inventory?.allowBackorder ?? false } });
    }
    if (src.attributes.length) await tx.productAttributeValue.createMany({ data: src.attributes.map((a) => ({ productId: product.id, attributeId: a.attributeId, value: a.value, numericValue: a.numericValue })) });
    if (src.documents.length) await tx.productDocument.createMany({ data: src.documents.map((d) => ({ productId: product.id, type: d.type, name: d.name, url: d.url, sortOrder: d.sortOrder })) });
    if (src.faqs.length) await tx.productFaq.createMany({ data: src.faqs.map((f) => ({ productId: product.id, question: f.question, answer: f.answer, sortOrder: f.sortOrder })) });
    if (src.relations.length) await tx.productRelation.createMany({ data: src.relations.map((r) => ({ sourceId: product.id, targetId: r.targetId, type: r.type, sortOrder: r.sortOrder })), skipDuplicates: true });
    return product;
  }, { timeout: 60_000, maxWait: 10_000 });
  await audit(user.id, "product.duplicate", "Product", created.id, { sourceId: src.id }, { sku, slug });
  revalidateCatalog();
  return { ok: true, data: { id: created.id }, message: t("admin.products.form.duplicated") };
}

/** Publie (ACTIVE + publishedAt), dépublie (DRAFT) ou archive un produit. */
export async function productStatusAction(input: { id: string; status: "DRAFT" | "ACTIVE" | "ARCHIVED" }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = z.object({ id: idSchema, status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const before = await db.product.findUnique({ where: { id: parsed.data.id }, select: { status: true, publishedAt: true, slug: true } });
  if (!before) return { ok: false, error: t("common.errors.notFound") };
  await db.product.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status, ...(parsed.data.status === "ACTIVE" && !before.publishedAt ? { publishedAt: new Date() } : {}) } });
  await audit(user.id, "product.status", "Product", parsed.data.id, { status: before.status }, { status: parsed.data.status });
  revalidateCatalog([`/admin/products/${parsed.data.id}`, `/p/${before.slug}`]);
  return { ok: true, message: t("admin.products.form.statusUpdated") };
}

/** Recherche rapide de produits (SKU produit/variante ou nom) pour les associations. */
export async function productSearchAction(input: { q: string; excludeId?: string }): Promise<ActionResult<{ id: string; sku: string; name: string; status: string }[]>> {
  await requireStaff();
  const parsed = z.object({ q: z.string().max(200), excludeId: z.string().max(64).optional() }).safeParse(input);
  if (!parsed.success) return { ok: true, data: [] };
  const q = parsed.data.q.trim().slice(0, 80);
  if (q.length < 2) return { ok: true, data: [] };
  const rows = await db.product.findMany({
    where: { ...(parsed.data.excludeId ? { id: { not: parsed.data.excludeId } } : {}), OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { variants: { some: { sku: { contains: q, mode: "insensitive" } } } }] },
    select: { id: true, sku: true, name: true, status: true }, orderBy: { name: "asc" }, take: 10,
  });
  return { ok: true, data: rows };
}

// ── Catégories ─────────────────────────────────────────────────────────────
const categorySchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().trim().min(1).max(120),
  slug: slugSchema,
  parentId: z.string().max(64).nullable(),
  description: optionalText(2000),
  image: optionalText(500),
  icon: optionalText(60),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  isVisible: z.boolean(),
  showInNav: z.boolean(),
  seoTitle: optionalText(160),
  seoDescription: optionalText(320),
  attributeIds: z.array(idSchema).max(50),
});
export type CategoryPayload = z.infer<typeof categorySchema>;

/** Crée ou met à jour une catégorie ; recalcule path/level du nœud et de ses descendants. */
export async function categorySaveAction(input: CategoryPayload): Promise<ActionResult<{ id: string }>> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  const c = parsed.data;
  const all = await db.category.findMany({ select: { id: true, slug: true, parentId: true, path: true, level: true } });
  const byId = new Map(all.map((x) => [x.id, x]));
  if (c.id && !byId.has(c.id)) return { ok: false, error: t("common.errors.notFound") };
  if (all.some((x) => x.slug === c.slug && x.id !== c.id)) return { ok: false, error: t("admin.categories.form.slugTaken"), fieldErrors: { slug: ["taken"] } };
  const parent = c.parentId ? byId.get(c.parentId) : undefined;
  if (c.parentId && !parent) return { ok: false, error: t("common.errors.validation"), fieldErrors: { parentId: ["unknown"] } };
  for (let cur = parent; cur; cur = cur.parentId ? byId.get(cur.parentId) : undefined) if (c.id && cur.id === c.id) return { ok: false, error: t("admin.categories.form.cycle"), fieldErrors: { parentId: ["cycle"] } };
  const path = parent ? `${parent.path}/${c.slug}` : c.slug;
  const level = parent ? parent.level + 1 : 0;
  const data = { name: c.name, slug: c.slug, parentId: c.parentId || null, description: c.description || null, image: c.image || null, icon: c.icon || null, sortOrder: c.sortOrder, isVisible: c.isVisible, showInNav: c.showInNav, seoTitle: c.seoTitle || null, seoDescription: c.seoDescription || null, path, level };
  const children = new Map<string, typeof all>();
  for (const x of all) if (x.parentId) (children.get(x.parentId) ?? children.set(x.parentId, []).get(x.parentId)!).push(x);
  const saved = await db.$transaction(async (tx) => {
    const row = c.id ? await tx.category.update({ where: { id: c.id }, data }) : await tx.category.create({ data });
    const stack = [{ id: row.id, path, level }];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const ch of children.get(cur.id) ?? []) {
        const next = { id: ch.id, path: `${cur.path}/${ch.slug}`, level: cur.level + 1 };
        await tx.category.update({ where: { id: ch.id }, data: { path: next.path, level: next.level } });
        stack.push(next);
      }
    }
    await tx.categoryAttribute.deleteMany({ where: { categoryId: row.id } });
    const ids = [...new Set(c.attributeIds)];
    if (ids.length) await tx.categoryAttribute.createMany({ data: ids.map((attributeId, i) => ({ categoryId: row.id, attributeId, isFilter: true, sortOrder: i })), skipDuplicates: true });
    return row;
  });
  await audit(user.id, c.id ? "category.update" : "category.create", "Category", saved.id, c.id ? byId.get(c.id) : null, { name: c.name, slug: c.slug, parentId: c.parentId, path });
  revalidateCatalog([`/admin/categories/${saved.id}`]);
  return { ok: true, data: { id: saved.id }, message: t("admin.categories.form.saved") };
}

export async function categoryDeleteAction(input: { id: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = z.object({ id: idSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const cat = await db.category.findUnique({ where: { id: parsed.data.id }, include: { _count: { select: { products: true, children: true } } } });
  if (!cat) return { ok: true };
  if (cat._count.products || cat._count.children) return { ok: false, error: t("admin.categories.form.deleteBlocked") };
  await db.category.delete({ where: { id: cat.id } });
  await audit(user.id, "category.delete", "Category", cat.id, { name: cat.name, slug: cat.slug, path: cat.path }, null);
  revalidateCatalog();
  return { ok: true, message: t("admin.categories.form.deleted") };
}

// ── Marques ────────────────────────────────────────────────────────────────
const brandSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().trim().min(1).max(120),
  slug: slugSchema,
  description: optionalText(2000),
  logo: optionalText(500),
  website: z.string().trim().url().max(300).or(z.literal("")),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  seoTitle: optionalText(160),
  seoDescription: optionalText(320),
});
export type BrandPayload = z.infer<typeof brandSchema>;

export async function brandSaveAction(input: BrandPayload): Promise<ActionResult<{ id: string }>> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  const { id, ...b } = parsed.data;
  const conflict = await db.brand.findFirst({ where: { slug: b.slug, ...(id ? { id: { not: id } } : {}) }, select: { id: true } });
  if (conflict) return { ok: false, error: t("admin.brands.form.slugTaken"), fieldErrors: { slug: ["taken"] } };
  const data = { ...b, description: b.description || null, logo: b.logo || null, website: b.website || null, seoTitle: b.seoTitle || null, seoDescription: b.seoDescription || null };
  const before = id ? await db.brand.findUnique({ where: { id } }) : null;
  if (id && !before) return { ok: false, error: t("common.errors.notFound") };
  const row = id ? await db.brand.update({ where: { id }, data }) : await db.brand.create({ data });
  await audit(user.id, id ? "brand.update" : "brand.create", "Brand", row.id, before ? { name: before.name, slug: before.slug, isActive: before.isActive } : null, { name: b.name, slug: b.slug, isActive: b.isActive });
  revalidateCatalog([`/admin/brands/${row.id}`, `/brand/${row.slug}`]);
  return { ok: true, data: { id: row.id }, message: t("admin.brands.form.saved") };
}

export async function brandDeleteAction(input: { id: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = z.object({ id: idSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const brand = await db.brand.findUnique({ where: { id: parsed.data.id }, include: { _count: { select: { products: true } } } });
  if (!brand) return { ok: true };
  if (brand._count.products) return { ok: false, error: t("admin.brands.form.deleteBlocked") };
  await db.brand.delete({ where: { id: brand.id } });
  await audit(user.id, "brand.delete", "Brand", brand.id, { name: brand.name, slug: brand.slug }, null);
  revalidateCatalog();
  return { ok: true, message: t("admin.brands.form.deleted") };
}

// ── Stock ──────────────────────────────────────────────────────────────────
const STOCK_MOVEMENT_TYPES = ["RECEIPT", "ADJUSTMENT", "RETURN", "SALE", "RESERVATION", "RELEASE"] as const;

/** Ajustement signé du stock : crée un mouvement et met à jour l'inventaire (jamais négatif). */
export async function inventoryAdjustAction(input: { variantId: string; quantity: number; type: string; reason?: string }): Promise<ActionResult<{ before: number; after: number }>> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = z.object({ variantId: idSchema, quantity: z.number().int().min(-1_000_000).max(1_000_000).refine((q) => q !== 0), type: z.enum(STOCK_MOVEMENT_TYPES), reason: optionalText(300) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("admin.inventory.quantityRequired") };
  const { variantId, quantity, type, reason } = parsed.data;
  const variant = await db.productVariant.findUnique({ where: { id: variantId }, select: { id: true, sku: true, productId: true } });
  if (!variant) return { ok: false, error: t("common.errors.notFound") };
  const result = await db.$transaction(async (tx) => {
    if (!(await tx.inventory.findUnique({ where: { variantId }, select: { variantId: true } }))) await tx.inventory.create({ data: { variantId, quantity: 0 } });
    // Mise à jour conditionnelle : la garde « quantité résultante ≥ 0 » est évaluée en base, donc sûre en cas d'ajustements concurrents.
    const updated = await tx.inventory.updateMany({ where: { variantId, ...(quantity < 0 ? { quantity: { gte: -quantity } } : {}) }, data: { quantity: { increment: quantity } } });
    if (updated.count === 0) return null;
    const after = (await tx.inventory.findUniqueOrThrow({ where: { variantId }, select: { quantity: true } })).quantity;
    await tx.stockMovement.create({ data: { variantId, type, quantity, reason: reason || null, referenceType: "manual", userId: user.id } });
    return { before: after - quantity, after };
  });
  if (!result) return { ok: false, error: t("admin.inventory.negativeBlocked") };
  await audit(user.id, "stock.adjust", "ProductVariant", variant.id, { quantity: result.before }, { quantity: result.after, delta: quantity, type, sku: variant.sku });
  revalidateTag("products", "max");
  revalidateTag("search", "max");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${variant.productId}`);
  return { ok: true, data: result, message: t("admin.inventory.adjusted") };
}

export interface StockMovementRow { id: string; type: string; quantity: number; reason: string | null; createdAt: string; user: string | null }

/** Dix derniers mouvements d'une variante. */
export async function inventoryMovementsAction(input: { variantId: string }): Promise<ActionResult<StockMovementRow[]>> {
  const t = await getT();
  await requireStaff();
  const parsed = z.object({ variantId: idSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const rows = await db.stockMovement.findMany({ where: { variantId: parsed.data.variantId }, orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { firstName: true, lastName: true } } } });
  return { ok: true, data: rows.map((r) => ({ id: r.id, type: r.type, quantity: r.quantity, reason: r.reason, createdAt: r.createdAt.toISOString(), user: r.user ? `${r.user.firstName} ${r.user.lastName}`.trim() : null })) };
}
