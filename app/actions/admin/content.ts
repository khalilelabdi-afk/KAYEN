"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { requireStaff, type ActionResult } from "@/lib/auth/dal";
import { fieldErrors, idSchema, optionalText, slugSchema } from "@/lib/validation/common";
import { slugify } from "@/lib/utils";
import { CMS_TAG, defaultHomeSections, type HomeSectionConfig } from "@/services/cms";
import { SECTORS_TAG } from "@/services/catalog/sectors";

async function audit(userId: string, action: string, entityType: string, entityId: string, before?: unknown, after?: unknown) {
  await db.auditLog.create({ data: { userId, action, entityType, entityId, before: before as Prisma.InputJsonValue, after: after as Prisma.InputJsonValue } });
}

const parseList = (value: string | undefined) => (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** Résout une liste de SKU (produit ou variante) en identifiants produit, dans l'ordre saisi. */
async function resolveProductSkus(skus: string[]): Promise<{ ids: string[]; unknown: string[] }> {
  if (!skus.length) return { ids: [], unknown: [] };
  const rows = await db.product.findMany({ where: { OR: [{ sku: { in: skus, mode: "insensitive" } }, { variants: { some: { sku: { in: skus, mode: "insensitive" } } } }] }, select: { id: true, sku: true, variants: { select: { sku: true } } } });
  const byKey = new Map<string, string>();
  for (const p of rows) { byKey.set(p.sku.toUpperCase(), p.id); for (const v of p.variants) byKey.set(v.sku.toUpperCase(), p.id); }
  const ids: string[] = [], unknown: string[] = [];
  for (const sku of skus) { const id = byKey.get(sku.toUpperCase()); if (!id) unknown.push(sku); else if (!ids.includes(id)) ids.push(id); }
  return { ids, unknown };
}

const contentStatus = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const revalidateCms = (...paths: string[]) => { revalidateTag(CMS_TAG, "max"); for (const p of paths) revalidatePath(p); };

// ── Page d'accueil ─────────────────────────────────────────────────────────
const homeSectionSchema = z.object({
  id: idSchema.optional(),
  type: z.enum(["HERO", "SECTORS", "CATEGORIES", "BESTSELLERS", "PROMOTIONS", "NEW_ARRIVALS", "BENEFITS", "BANNER", "COLLECTION", "BRANDS", "GUIDES"]),
  title: optionalText(160), subtitle: optionalText(300), ctaLabel: optionalText(80), ctaHref: optionalText(300), image: optionalText(500),
  limit: z.number().int().min(1).max(48).nullable(), productSkus: optionalText(2000), categorySlugs: optionalText(2000), variant: optionalText(40),
  isActive: z.boolean(),
});
export type HomeSectionInput = z.infer<typeof homeSectionSchema>;

export async function homeSectionsInitAction(): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  if (await db.homeSection.count()) return { ok: false, error: t("common.errors.generic") };
  await db.homeSection.createMany({ data: defaultHomeSections.map((s, i) => ({ type: s.type, title: s.title, subtitle: s.subtitle, ctaLabel: s.ctaLabel, ctaHref: s.ctaHref, image: s.image, config: s.config as Prisma.InputJsonValue, sortOrder: i, isActive: true })) });
  await audit(user.id, "homeSection.init", "HomeSection", "*", null, { count: defaultHomeSections.length });
  revalidateCms("/", "/admin/homepage");
  return { ok: true, message: t("admin.cms.homepage.initialized") };
}

export async function homeSectionSaveAction(input: HomeSectionInput): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = homeSectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  const { id, limit, productSkus, categorySlugs, variant, ...rest } = parsed.data;
  const config: HomeSectionConfig = {};
  if (limit) config.limit = limit;
  const skus = parseList(productSkus).map((s) => s.toUpperCase()), slugs = parseList(categorySlugs).map((s) => s.toLowerCase());
  if (skus.length) config.productSkus = skus;
  if (slugs.length) config.categorySlugs = slugs;
  if (variant) config.variant = variant;
  const data = { ...rest, title: rest.title || null, subtitle: rest.subtitle || null, ctaLabel: rest.ctaLabel || null, ctaHref: rest.ctaHref || null, image: rest.image || null, config: config as Prisma.InputJsonValue };
  const before = id ? await db.homeSection.findUnique({ where: { id } }) : null;
  if (id && !before) return { ok: false, error: t("common.errors.notFound") };
  const row = before ? await db.homeSection.update({ where: { id: before.id }, data }) : await db.homeSection.create({ data: { ...data, sortOrder: ((await db.homeSection.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? -1) + 1 } });
  await audit(user.id, before ? "homeSection.update" : "homeSection.create", "HomeSection", row.id, before ? { title: before.title, config: before.config } : null, { type: row.type, title: row.title, config });
  revalidateCms("/", "/admin/homepage");
  return { ok: true, message: t("admin.cms.homepage.saved") };
}

export async function homeSectionToggleAction(input: { id: string; isActive: boolean }): Promise<ActionResult> {
  const user = await requireStaff();
  await db.homeSection.update({ where: { id: input.id }, data: { isActive: input.isActive } });
  await audit(user.id, "homeSection.toggle", "HomeSection", input.id, null, { isActive: input.isActive });
  revalidateCms("/", "/admin/homepage");
  return { ok: true };
}

export async function homeSectionMoveAction(input: { id: string; direction: "up" | "down" }): Promise<ActionResult> {
  const user = await requireStaff();
  const rows = await db.homeSection.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
  const i = rows.findIndex((r) => r.id === input.id);
  const j = input.direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return { ok: true };
  const order = rows.map((r) => r.id);
  [order[i], order[j]] = [order[j], order[i]];
  await db.$transaction(order.map((id, idx) => db.homeSection.update({ where: { id }, data: { sortOrder: idx } })));
  await audit(user.id, "homeSection.move", "HomeSection", input.id, { position: i }, { position: j });
  revalidateCms("/", "/admin/homepage");
  return { ok: true };
}

export async function homeSectionDeleteAction(input: { id: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const row = await db.homeSection.findUnique({ where: { id: input.id } });
  if (!row) return { ok: true };
  await db.homeSection.delete({ where: { id: row.id } });
  await audit(user.id, "homeSection.delete", "HomeSection", row.id, { type: row.type, title: row.title }, null);
  revalidateCms("/", "/admin/homepage");
  return { ok: true, message: t("admin.cms.homepage.deleted") };
}

// ── Activités (secteurs) ───────────────────────────────────────────────────
const sectorSchema = z.object({
  id: idSchema.optional(), name: z.string().trim().min(2).max(120), slug: slugSchema, heroTitle: z.string().trim().min(2).max(200), heroSubtitle: optionalText(300), description: optionalText(4000),
  image: optionalText(500), icon: optionalText(60), sortOrder: z.coerce.number().int().min(0).max(9999), isActive: z.boolean(), seoTitle: optionalText(160), seoDescription: optionalText(320),
  categoryIds: z.array(idSchema).max(200), productSkus: optionalText(4000),
});
export type SectorInput = z.infer<typeof sectorSchema>;

export async function sectorSaveAction(input: SectorInput): Promise<ActionResult<{ id: string }>> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = sectorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  const { id, categoryIds, productSkus, ...rest } = parsed.data;
  if (await db.sector.findFirst({ where: { slug: rest.slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } })) return { ok: false, error: t("common.errors.validation"), fieldErrors: { slug: [t("common.errors.validation")] } };
  const { ids: productIds, unknown } = await resolveProductSkus(parseList(productSkus));
  if (unknown.length) return { ok: false, error: t("admin.cms.sectors.form.unknownSkus", { skus: unknown.join(", ") }), fieldErrors: { productSkus: [t("admin.cms.sectors.form.unknownSkus", { skus: unknown.join(", ") })] } };
  const data = { ...rest, heroSubtitle: rest.heroSubtitle || null, description: rest.description || null, image: rest.image || null, icon: rest.icon || null, seoTitle: rest.seoTitle || null, seoDescription: rest.seoDescription || null };
  const before = id ? await db.sector.findUnique({ where: { id } }) : null;
  if (id && !before) return { ok: false, error: t("common.errors.notFound") };
  const row = await db.$transaction(async (tx) => {
    const saved = before ? await tx.sector.update({ where: { id: before.id }, data }) : await tx.sector.create({ data });
    await tx.sectorCategory.deleteMany({ where: { sectorId: saved.id } });
    await tx.sectorProduct.deleteMany({ where: { sectorId: saved.id } });
    if (categoryIds.length) await tx.sectorCategory.createMany({ data: categoryIds.map((categoryId, i) => ({ sectorId: saved.id, categoryId, sortOrder: i })) });
    if (productIds.length) await tx.sectorProduct.createMany({ data: productIds.map((productId, i) => ({ sectorId: saved.id, productId, sortOrder: i })) });
    return saved;
  });
  await audit(user.id, before ? "sector.update" : "sector.create", "Sector", row.id, before ? { name: before.name, slug: before.slug, isActive: before.isActive } : null, { name: row.name, slug: row.slug, isActive: row.isActive, categoryIds, productIds });
  revalidateTag(SECTORS_TAG, "max");
  revalidatePath("/admin/sectors"); revalidatePath("/professionnels"); revalidatePath(`/professionnels/${row.slug}`);
  if (before && before.slug !== row.slug) revalidatePath(`/professionnels/${before.slug}`);
  return { ok: true, data: { id: row.id }, message: t("admin.cms.sectors.form.saved") };
}

export async function sectorDeleteAction(input: { id: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const row = await db.sector.findUnique({ where: { id: input.id } });
  if (!row) return { ok: true };
  await db.sector.delete({ where: { id: row.id } });
  await audit(user.id, "sector.delete", "Sector", row.id, { name: row.name, slug: row.slug }, null);
  revalidateTag(SECTORS_TAG, "max");
  revalidatePath("/admin/sectors"); revalidatePath("/professionnels"); revalidatePath(`/professionnels/${row.slug}`);
  return { ok: true, message: t("admin.cms.sectors.deleted") };
}

// ── Pages CMS ──────────────────────────────────────────────────────────────
const pageSchema = z.object({ id: idSchema.optional(), title: z.string().trim().min(2).max(200), slug: slugSchema, excerpt: optionalText(500), content: z.string().max(100_000), status: contentStatus, showInFooter: z.boolean(), seoTitle: optionalText(160), seoDescription: optionalText(320) });
export type CmsPageInput = z.infer<typeof pageSchema>;

export async function cmsPageSaveAction(input: CmsPageInput): Promise<ActionResult<{ id: string }>> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = pageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  const { id, ...rest } = parsed.data;
  if (await db.cmsPage.findFirst({ where: { slug: rest.slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } })) return { ok: false, error: t("common.errors.validation"), fieldErrors: { slug: [t("common.errors.validation")] } };
  const before = id ? await db.cmsPage.findUnique({ where: { id } }) : null;
  if (id && !before) return { ok: false, error: t("common.errors.notFound") };
  const data = { ...rest, excerpt: rest.excerpt || null, seoTitle: rest.seoTitle || null, seoDescription: rest.seoDescription || null, publishedAt: rest.status === "PUBLISHED" ? (before?.publishedAt ?? new Date()) : before?.publishedAt ?? null };
  const row = before ? await db.cmsPage.update({ where: { id: before.id }, data }) : await db.cmsPage.create({ data });
  await audit(user.id, before ? "cmsPage.update" : "cmsPage.create", "CmsPage", row.id, before ? { title: before.title, slug: before.slug, status: before.status } : null, { title: row.title, slug: row.slug, status: row.status });
  revalidateCms("/admin/pages", `/pages/${row.slug}`);
  if (before && before.slug !== row.slug) revalidatePath(`/pages/${before.slug}`);
  return { ok: true, data: { id: row.id }, message: t("admin.cms.pages.form.saved") };
}

export async function cmsPageDeleteAction(input: { id: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const row = await db.cmsPage.findUnique({ where: { id: input.id } });
  if (!row) return { ok: true };
  await db.cmsPage.delete({ where: { id: row.id } });
  await audit(user.id, "cmsPage.delete", "CmsPage", row.id, { title: row.title, slug: row.slug }, null);
  revalidateCms("/admin/pages", `/pages/${row.slug}`);
  return { ok: true, message: t("admin.cms.pages.deleted") };
}

// ── Guides (blog) ──────────────────────────────────────────────────────────
const guideSchema = z.object({
  id: idSchema.optional(), title: z.string().trim().min(2).max(200), slug: slugSchema, excerpt: optionalText(500), content: z.string().max(100_000), image: optionalText(500),
  categoryId: z.string().max(64).nullable(), authorName: optionalText(120), readingMinutes: z.coerce.number().int().min(1).max(180), status: contentStatus,
  publishedAt: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/), productSkus: optionalText(4000), seoTitle: optionalText(160), seoDescription: optionalText(320),
});
export type GuideInput = z.infer<typeof guideSchema>;

export async function guideSaveAction(input: GuideInput): Promise<ActionResult<{ id: string }>> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = guideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  const { id, productSkus, publishedAt, categoryId, ...rest } = parsed.data;
  if (await db.blogPost.findFirst({ where: { slug: rest.slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } })) return { ok: false, error: t("common.errors.validation"), fieldErrors: { slug: [t("common.errors.validation")] } };
  const { ids: productIds, unknown } = await resolveProductSkus(parseList(productSkus));
  if (unknown.length) return { ok: false, error: t("admin.cms.guides.unknownSkus", { skus: unknown.join(", ") }), fieldErrors: { productSkus: [t("admin.cms.guides.unknownSkus", { skus: unknown.join(", ") })] } };
  const before = id ? await db.blogPost.findUnique({ where: { id } }) : null;
  if (id && !before) return { ok: false, error: t("common.errors.notFound") };
  const date = publishedAt ? new Date(`${publishedAt}T09:00:00.000Z`) : rest.status === "PUBLISHED" ? (before?.publishedAt ?? new Date()) : (before?.publishedAt ?? null);
  const data = { ...rest, excerpt: rest.excerpt || null, image: rest.image || null, authorName: rest.authorName || null, seoTitle: rest.seoTitle || null, seoDescription: rest.seoDescription || null, categoryId: categoryId || null, publishedAt: date, ...(before ? {} : { authorId: user.id }) };
  const row = await db.$transaction(async (tx) => {
    const saved = before ? await tx.blogPost.update({ where: { id: before.id }, data }) : await tx.blogPost.create({ data });
    await tx.blogPostProduct.deleteMany({ where: { postId: saved.id } });
    if (productIds.length) await tx.blogPostProduct.createMany({ data: productIds.map((productId, i) => ({ postId: saved.id, productId, sortOrder: i })) });
    return saved;
  });
  await audit(user.id, before ? "guide.update" : "guide.create", "BlogPost", row.id, before ? { title: before.title, slug: before.slug, status: before.status } : null, { title: row.title, slug: row.slug, status: row.status, productIds });
  revalidateCms("/admin/guides", "/guides", `/guides/${row.slug}`, "/");
  if (before && before.slug !== row.slug) revalidatePath(`/guides/${before.slug}`);
  return { ok: true, data: { id: row.id }, message: t("admin.cms.guides.form.saved") };
}

export async function guideDeleteAction(input: { id: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const row = await db.blogPost.findUnique({ where: { id: input.id } });
  if (!row) return { ok: true };
  await db.blogPost.delete({ where: { id: row.id } });
  await audit(user.id, "guide.delete", "BlogPost", row.id, { title: row.title, slug: row.slug }, null);
  revalidateCms("/admin/guides", "/guides", `/guides/${row.slug}`, "/");
  return { ok: true, message: t("admin.cms.guides.deleted") };
}

export async function blogCategoryAction(input: { name: string; slug?: string }): Promise<ActionResult<{ id: string; name: string; slug: string }>> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = z.object({ name: z.string().trim().min(2).max(80), slug: z.string().trim().max(120).optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slugSchema.safeParse(slug).success) return { ok: false, error: t("common.errors.validation"), fieldErrors: { slug: [t("common.errors.validation")] } };
  if (await db.blogCategory.findUnique({ where: { slug } })) return { ok: false, error: t("common.errors.validation"), fieldErrors: { slug: [t("common.errors.validation")] } };
  const sortOrder = ((await db.blogCategory.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? -1) + 1;
  const row = await db.blogCategory.create({ data: { name: parsed.data.name, slug, sortOrder } });
  await audit(user.id, "blogCategory.create", "BlogCategory", row.id, null, { name: row.name, slug: row.slug });
  revalidateCms("/admin/guides", "/guides");
  return { ok: true, data: { id: row.id, name: row.name, slug: row.slug }, message: t("admin.cms.guides.categoryForm.saved") };
}

// ── FAQ ────────────────────────────────────────────────────────────────────
const faqSchema = z.object({ id: idSchema.optional(), category: z.enum(["commande", "compte", "prix", "livraison", "devis", "paiement", "facturation", "retours", "disponibilite"]), question: z.string().trim().min(3).max(300), answer: z.string().trim().min(3).max(4000), sortOrder: z.coerce.number().int().min(0).max(9999), isActive: z.boolean() });
export type FaqInput = z.infer<typeof faqSchema>;

export async function faqSaveAction(input: FaqInput): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  const { id, ...data } = parsed.data;
  const before = id ? await db.faq.findUnique({ where: { id } }) : null;
  if (id && !before) return { ok: false, error: t("common.errors.notFound") };
  const row = before ? await db.faq.update({ where: { id: before.id }, data }) : await db.faq.create({ data });
  await audit(user.id, before ? "faq.update" : "faq.create", "Faq", row.id, before ? { question: before.question, category: before.category } : null, { question: row.question, category: row.category, isActive: row.isActive });
  revalidateCms("/admin/faq", "/faq");
  return { ok: true, message: t("admin.cms.faq.form.saved") };
}

export async function faqDeleteAction(input: { id: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const row = await db.faq.findUnique({ where: { id: input.id } });
  if (!row) return { ok: true };
  await db.faq.delete({ where: { id: row.id } });
  await audit(user.id, "faq.delete", "Faq", row.id, { question: row.question, category: row.category }, null);
  revalidateCms("/admin/faq", "/faq");
  return { ok: true, message: t("admin.cms.faq.deleted") };
}
