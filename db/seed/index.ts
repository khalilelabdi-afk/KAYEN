/**
 * Seed KAYEN — données de démonstration réalistes.
 * Lancer : pnpm db:seed (idempotent : upsert par slug/SKU).
 */
import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { attributes } from "./data/attributes";
import { categories } from "./data/categories";
import { brands } from "./data/brands";
import { sectors } from "./data/sectors";
import { allProducts } from "./data/products";
import { promotions } from "./data/promotions";
import { guides, guideCategories } from "./data/guides";
import { faqs } from "./data/faq";
import { pages } from "./data/pages";
import { synonyms } from "./data/synonyms";
import type { SeedCategory, SeedProduct } from "./types";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function slugify(input: string) {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);

async function seedTaxAndShipping() {
  await db.taxClass.upsert({ where: { code: "standard" }, create: { code: "standard", name: "TVA taux normal", rateBps: 2000, isDefault: true }, update: { rateBps: 2000, isDefault: true } });
  await db.taxClass.upsert({ where: { code: "reduced" }, create: { code: "reduced", name: "TVA taux réduit", rateBps: 550 }, update: { rateBps: 550 } });
  const methods = [
    { code: "standard", name: "Livraison standard", description: "Colis ou palette selon le volume", price: 1490, freeAbove: null, minDays: 2, maxDays: 5, sortOrder: 1 },
    { code: "express", name: "Livraison express", description: "Expédition prioritaire", price: 2990, freeAbove: null, minDays: 1, maxDays: 2, sortOrder: 2 },
    { code: "pallet", name: "Livraison palette", description: "Pour les volumes importants, livraison sur quai ou hayon", price: 8900, freeAbove: 150000, minDays: 3, maxDays: 7, sortOrder: 3 },
  ];
  for (const m of methods) await db.shippingMethod.upsert({ where: { code: m.code }, create: m, update: m });
}

async function seedGroups() {
  await db.customerGroup.upsert({ where: { code: "pro" }, create: { code: "pro", name: "Tarif professionnel", discountBps: 0, isDefault: true, description: "Conditions standard des comptes professionnels" }, update: { isDefault: true } });
  await db.customerGroup.upsert({ where: { code: "key-account" }, create: { code: "key-account", name: "Grands comptes", discountBps: 500, description: "Remise globale de 5 % sur le tarif public" }, update: { discountBps: 500 } });
  await db.customerGroup.upsert({ where: { code: "reseller" }, create: { code: "reseller", name: "Revendeurs", discountBps: 800, description: "Remise globale de 8 % pour la revente" }, update: { discountBps: 800 } });
}

async function seedAttributes() {
  const map = new Map<string, string>();
  for (const [i, a] of attributes.entries()) {
    const row = await db.attribute.upsert({ where: { code: a.code }, create: { code: a.code, name: a.name, type: a.type, unit: a.unit ?? null, isFilterable: a.isFilterable ?? true, sortOrder: i }, update: { name: a.name, type: a.type, unit: a.unit ?? null, isFilterable: a.isFilterable ?? true, sortOrder: i } });
    map.set(a.code, row.id);
  }
  return map;
}

async function seedCategories(attrIds: Map<string, string>) {
  const ids = new Map<string, string>();
  const rootPicto: Record<string, string> = {};
  async function walk(nodes: SeedCategory[], parentId: string | null, parentPath: string, level: number, rootSlug: string | null) {
    for (const [i, c] of nodes.entries()) {
      const path = parentPath ? `${parentPath}/${c.slug}` : c.slug;
      const root = rootSlug ?? c.slug;
      rootPicto[c.slug] = root;
      const data = { name: c.name, description: c.description ?? null, image: `/images/categories/${c.slug}.svg`, icon: c.icon ?? null, parentId, path, level, sortOrder: c.sortOrder ?? i, isVisible: true, showInNav: level === 0 ? (c.showInNav ?? true) : false, seoTitle: c.seoTitle ?? null, seoDescription: c.seoDescription ?? null };
      const row = await db.category.upsert({ where: { slug: c.slug }, create: { slug: c.slug, ...data }, update: data });
      ids.set(c.slug, row.id);
      for (const [j, code] of (c.attributes ?? []).entries()) {
        const attributeId = attrIds.get(code);
        if (!attributeId) continue;
        await db.categoryAttribute.upsert({ where: { categoryId_attributeId: { categoryId: row.id, attributeId } }, create: { categoryId: row.id, attributeId, isFilter: true, sortOrder: j }, update: { sortOrder: j } });
      }
      if (c.children) await walk(c.children, row.id, path, level + 1, root);
    }
  }
  await walk(categories, null, "", 0, null);
  return ids;
}

async function seedBrands() {
  const ids = new Map<string, string>();
  for (const [i, b] of brands.entries()) {
    const data = { name: b.name, description: b.description, logo: `/images/brands/${b.slug}.svg`, website: b.website ?? null, isActive: true, isFeatured: b.isFeatured ?? false, sortOrder: i };
    const row = await db.brand.upsert({ where: { slug: b.slug }, create: { slug: b.slug, ...data }, update: data });
    ids.set(b.slug, row.id);
  }
  return ids;
}

async function seedProducts(categoryIds: Map<string, string>, brandIds: Map<string, string>, attrIds: Map<string, string>) {
  const productIds = new Map<string, string>();
  const variantIds = new Map<string, string>();
  const [standard, reduced] = await Promise.all([db.taxClass.findUniqueOrThrow({ where: { code: "standard" } }), db.taxClass.findUniqueOrThrow({ where: { code: "reduced" } })]);

  for (const p of allProducts) {
    const categoryId = categoryIds.get(p.categorySlug);
    const brandId = brandIds.get(p.brandSlug);
    if (!categoryId) throw new Error(`Catégorie inconnue ${p.categorySlug} pour ${p.sku}`);
    const slug = slugify(p.name);
    const hasVariants = !!p.variants?.length;
    const publishedAt = daysAgo(p.publishedDaysAgo ?? 120);
    const base = {
      name: p.name,
      shortDescription: p.shortDescription,
      description: p.description,
      usageTips: p.usageTips ?? null,
      status: "ACTIVE" as const,
      publishedAt,
      brandId: brandId ?? null,
      categoryId,
      taxClassId: p.taxClass === "reduced" ? reduced.id : standard.id,
      hasVariants,
      requiresAccount: p.requiresAccount ?? false,
      keywords: p.keywords,
      salesCount: p.salesCount ?? 0,
      viewCount: Math.round((p.salesCount ?? 0) * 7 + 20),
      priceFrom: Math.min(p.basePrice, ...(p.variants ?? []).map((v) => v.basePrice ?? p.basePrice)),
    };
    const product = await db.product.upsert({ where: { sku: p.sku }, create: { sku: p.sku, slug, ...base }, update: { ...base, slug } });
    productIds.set(p.sku, product.id);

    // Images
    await db.productImage.deleteMany({ where: { productId: product.id } });
    const n = Math.min(3, Math.max(1, p.imageCount ?? 1));
    for (let i = 0; i < n; i++) {
      await db.productImage.create({ data: { productId: product.id, url: `/images/products/${p.sku.toLowerCase()}-${i + 1}.svg`, alt: i === 0 ? p.name : `${p.name} — vue ${i + 1}`, width: 1200, height: 1200, sortOrder: i, isPrimary: i === 0 } });
    }

    // Attributs
    await db.productAttributeValue.deleteMany({ where: { productId: product.id } });
    for (const [code, value] of Object.entries(p.attributes)) {
      const attributeId = attrIds.get(code);
      if (!attributeId) continue;
      const str = typeof value === "boolean" ? (value ? "Oui" : "Non") : String(value);
      await db.productAttributeValue.create({ data: { productId: product.id, attributeId, value: str, numericValue: typeof value === "number" ? value : null } });
    }

    // Documents & FAQ
    await db.productDocument.deleteMany({ where: { productId: product.id } });
    for (const [i, d] of (p.documents ?? []).entries()) await db.productDocument.create({ data: { productId: product.id, type: d.type, name: d.name, url: `/documents/${p.sku.toLowerCase()}-${i + 1}.pdf`, sortOrder: i } });
    await db.productFaq.deleteMany({ where: { productId: product.id } });
    for (const [i, f] of (p.faqs ?? []).entries()) await db.productFaq.create({ data: { productId: product.id, question: f.question, answer: f.answer, sortOrder: i } });

    // Variantes
    const variantsToCreate = hasVariants
      ? p.variants!.map((v, i) => ({ sku: v.sku, name: v.name, options: v.options, basePrice: v.basePrice ?? p.basePrice, compareAtPrice: v.compareAtPrice ?? p.compareAtPrice ?? null, stock: v.stock ?? p.stock, tiers: v.tiers ?? p.tiers, ean: v.ean ?? null, weightGrams: v.weightGrams ?? p.weightGrams ?? null, isDefault: i === 0, position: i }))
      : [{ sku: p.sku, name: null as string | null, options: {} as Record<string, string>, basePrice: p.basePrice, compareAtPrice: p.compareAtPrice ?? null, stock: p.stock, tiers: p.tiers, ean: p.ean ?? null, weightGrams: p.weightGrams ?? null, isDefault: true, position: 0 }];

    // Options
    await db.productOption.deleteMany({ where: { productId: product.id } });
    const optionIds = new Map<string, string>();
    if (hasVariants) {
      const names = [...new Set(p.variants!.flatMap((v) => Object.keys(v.options)))];
      for (const [i, name] of names.entries()) {
        const opt = await db.productOption.create({ data: { productId: product.id, name, sortOrder: i } });
        optionIds.set(name, opt.id);
      }
    }

    for (const v of variantsToCreate) {
      const vdata = {
        productId: product.id, ean: v.ean, name: v.name, isDefault: v.isDefault, isActive: true, position: v.position, basePrice: v.basePrice, compareAtPrice: v.compareAtPrice, costPrice: p.costPrice ?? Math.round(v.basePrice * 0.62),
        moq: p.moq, orderMultiple: p.orderMultiple ?? 1, unitLabel: p.unitLabel, packagingLabel: p.packagingLabel ?? null, unitsPerPack: p.unitsPerPack ?? null, quoteOnlyAbove: p.quoteOnlyAbove ?? null, leadTimeDays: p.leadTimeDays ?? null,
        weightGrams: v.weightGrams, lengthMm: p.dimensionsMm?.[0] ?? null, widthMm: p.dimensionsMm?.[1] ?? null, heightMm: p.dimensionsMm?.[2] ?? null,
      };
      const variant = await db.productVariant.upsert({ where: { sku: v.sku }, create: { sku: v.sku, ...vdata }, update: vdata });
      variantIds.set(v.sku, variant.id);
      await db.priceTier.deleteMany({ where: { variantId: variant.id } });
      for (const tier of v.tiers) await db.priceTier.create({ data: { variantId: variant.id, minQuantity: tier.minQuantity, unitPrice: tier.unitPrice } });
      await db.inventory.upsert({ where: { variantId: variant.id }, create: { variantId: variant.id, quantity: v.stock, reserved: 0, lowStockThreshold: p.lowStockThreshold ?? 10, allowBackorder: p.allowBackorder ?? false }, update: { quantity: v.stock, lowStockThreshold: p.lowStockThreshold ?? 10, allowBackorder: p.allowBackorder ?? false } });
      await db.variantOptionValue.deleteMany({ where: { variantId: variant.id } });
      for (const [name, value] of Object.entries(v.options)) {
        const optionId = optionIds.get(name);
        if (optionId) await db.variantOptionValue.create({ data: { variantId: variant.id, optionId, value } });
      }
    }
    // Supprime les variantes orphelines d'un seed précédent
    await db.productVariant.deleteMany({ where: { productId: product.id, sku: { notIn: variantsToCreate.map((v) => v.sku) } } });
  }

  // Relations (après création de tous les produits)
  for (const p of allProducts) {
    const sourceId = productIds.get(p.sku)!;
    await db.productRelation.deleteMany({ where: { sourceId } });
    for (const [i, r] of (p.related ?? []).entries()) {
      const targetId = productIds.get(r.sku);
      if (!targetId || targetId === sourceId) continue;
      await db.productRelation.upsert({ where: { sourceId_targetId_type: { sourceId, targetId, type: r.type } }, create: { sourceId, targetId, type: r.type, sortOrder: i }, update: { sortOrder: i } });
    }
  }
  return { productIds, variantIds };
}

async function seedSectors(categoryIds: Map<string, string>, productIds: Map<string, string>) {
  for (const [i, s] of sectors.entries()) {
    const data = { name: s.name, heroTitle: s.heroTitle, heroSubtitle: s.heroSubtitle, description: s.description, image: `/images/sectors/${s.slug}.svg`, icon: s.icon, sortOrder: i, isActive: true, seoTitle: s.seoTitle, seoDescription: s.seoDescription };
    const row = await db.sector.upsert({ where: { slug: s.slug }, create: { slug: s.slug, ...data }, update: data });
    await db.sectorCategory.deleteMany({ where: { sectorId: row.id } });
    for (const [j, slug] of s.categorySlugs.entries()) {
      const categoryId = categoryIds.get(slug);
      if (categoryId) await db.sectorCategory.create({ data: { sectorId: row.id, categoryId, sortOrder: j } });
    }
    await db.sectorProduct.deleteMany({ where: { sectorId: row.id } });
    for (const [j, sku] of s.featuredSkus.entries()) {
      const productId = productIds.get(sku);
      if (productId) await db.sectorProduct.create({ data: { sectorId: row.id, productId, sortOrder: j } });
    }
  }
}

async function seedPromotions(categoryIds: Map<string, string>, brandIds: Map<string, string>, productIds: Map<string, string>) {
  await db.promotion.deleteMany({});
  for (const [i, p] of promotions.entries()) {
    const row = await db.promotion.create({
      data: {
        name: p.name, description: p.description ?? null, type: p.type, scope: p.scope, valueBps: p.valueBps ?? null, valueAmount: p.valueAmount ?? null, specialPrice: p.specialPrice ?? null, minQuantity: p.minQuantity ?? null, minOrderAmount: p.minOrderAmount ?? null,
        isAutomatic: p.isAutomatic ?? true, isActive: true, startsAt: daysAgo(3), endsAt: p.daysValid ? daysFromNow(p.daysValid) : null, priority: promotions.length - i, showBadge: true, badgeLabel: p.badgeLabel ?? null,
        products: { create: (p.productSkus ?? []).map((sku) => productIds.get(sku)).filter((id): id is string => !!id).map((productId) => ({ productId })) },
        categories: { create: (p.categorySlugs ?? []).map((s) => categoryIds.get(s)).filter((id): id is string => !!id).map((categoryId) => ({ categoryId })) },
        brands: { create: (p.brandSlugs ?? []).map((s) => brandIds.get(s)).filter((id): id is string => !!id).map((brandId) => ({ brandId })) },
        coupons: { create: (p.couponCodes ?? []).map((code) => ({ code })) },
      },
    });
    void row;
  }
}

async function seedContent(productIds: Map<string, string>, adminId: string) {
  for (const [i, c] of guideCategories.entries()) await db.blogCategory.upsert({ where: { slug: c.slug }, create: { slug: c.slug, name: c.name, sortOrder: i }, update: { name: c.name, sortOrder: i } });
  for (const g of guides) {
    const category = await db.blogCategory.findUnique({ where: { slug: g.categorySlug } });
    const data = { title: g.title, excerpt: g.excerpt, content: g.content, image: `/images/guides/${g.slug}.svg`, categoryId: category?.id ?? null, authorId: adminId, authorName: g.authorName, status: "PUBLISHED" as const, readingMinutes: g.readingMinutes, publishedAt: daysAgo(g.publishedDaysAgo), seoTitle: g.title, seoDescription: g.excerpt };
    const row = await db.blogPost.upsert({ where: { slug: g.slug }, create: { slug: g.slug, ...data }, update: data });
    await db.blogPostProduct.deleteMany({ where: { postId: row.id } });
    for (const [j, sku] of g.relatedSkus.entries()) {
      const productId = productIds.get(sku);
      if (productId) await db.blogPostProduct.create({ data: { postId: row.id, productId, sortOrder: j } });
    }
  }
  await db.faq.deleteMany({});
  for (const [i, f] of faqs.entries()) await db.faq.create({ data: { category: f.category, question: f.question, answer: f.answer, sortOrder: i, isActive: true } });
  for (const p of pages) {
    const data = { title: p.title, excerpt: p.excerpt ?? null, content: p.content, status: "PUBLISHED" as const, showInFooter: p.showInFooter ?? true, publishedAt: daysAgo(30) };
    await db.cmsPage.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data });
  }
  await db.searchSynonym.deleteMany({});
  for (const s of synonyms) await db.searchSynonym.create({ data: { term: s.term, synonyms: s.synonyms } });
}

async function seedUsers() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@kayen.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";
  const admin = await db.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 12), firstName: "Admin", lastName: "KAYEN", role: "ADMIN", emailVerifiedAt: new Date() },
    update: { role: "ADMIN" },
  });
  // Client de démonstration approuvé
  const demoHash = await bcrypt.hash("Demo1234!", 12);
  const group = await db.customerGroup.findUnique({ where: { code: "pro" } });
  const sector = await db.sector.findUnique({ where: { slug: "cafe-restaurant" } });
  const demo = await db.user.upsert({
    where: { email: "demo@kayen.local" },
    create: { email: "demo@kayen.local", passwordHash: demoHash, firstName: "Camille", lastName: "Durand", phone: "+33 6 00 00 00 00", role: "CUSTOMER", emailVerifiedAt: new Date() },
    update: {},
  });
  let business = await db.business.findFirst({ where: { members: { some: { userId: demo.id } } } });
  if (!business) {
    business = await db.business.create({
      data: {
        name: "Café Demo", legalName: "Café Demo SARL", sectorId: sector?.id ?? null, taxId: "FR00000000000", email: "demo@kayen.local", phone: "+33 1 00 00 00 00", status: "APPROVED", customerGroupId: group?.id ?? null, allowInvoicePay: true, invoiceTermDays: 30, approvedAt: new Date(),
        members: { create: { userId: demo.id, role: "OWNER" } },
        addresses: { create: [{ label: "Boutique", company: "Café Demo", line1: "12 rue de la Demo", postalCode: "75011", city: "Paris", countryCode: "FR", phone: "+33 1 00 00 00 00", isDefaultBilling: true, isDefaultShipping: true }] },
        lists: { create: { userId: demo.id, name: "Favoris", isDefault: true } },
      },
    });
  }
  return { admin, demo, business };
}

async function main() {
  console.log("→ Taxes, livraison, groupes…");
  await seedTaxAndShipping();
  await seedGroups();
  console.log("→ Attributs & catégories…");
  const attrIds = await seedAttributes();
  const categoryIds = await seedCategories(attrIds);
  console.log("→ Marques…");
  const brandIds = await seedBrands();
  console.log(`→ Produits (${allProducts.length})…`);
  const { productIds } = await seedProducts(categoryIds, brandIds, attrIds);
  console.log("→ Activités…");
  await seedSectors(categoryIds, productIds);
  console.log("→ Promotions…");
  await seedPromotions(categoryIds, brandIds, productIds);
  console.log("→ Utilisateurs…");
  const { admin } = await seedUsers();
  console.log("→ Contenu (guides, FAQ, pages, synonymes)…");
  await seedContent(productIds, admin.id);
  const counts = { produits: await db.product.count(), variantes: await db.productVariant.count(), categories: await db.category.count(), marques: await db.brand.count() };
  console.log("✔ Seed terminé", counts);
  console.log(`   Admin : ${process.env.SEED_ADMIN_EMAIL ?? "admin@kayen.local"} / ${process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!"}`);
  console.log("   Client démo : demo@kayen.local / Demo1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
