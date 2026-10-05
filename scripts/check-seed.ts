/**
 * Vérification de cohérence des données de démonstration (db/seed/data).
 * Lancer : pnpm tsx scripts/check-seed.ts
 * Sort avec le code 1 si au moins un problème est détecté.
 */
import { attributes } from "../db/seed/data/attributes";
import { categories } from "../db/seed/data/categories";
import { brands } from "../db/seed/data/brands";
import { sectors } from "../db/seed/data/sectors";
import { allProducts } from "../db/seed/data/products";
import { restaurationProducts } from "../db/seed/data/products/restauration";
import { hotellerieProducts } from "../db/seed/data/products/hotellerie";
import { hygieneProducts } from "../db/seed/data/products/hygiene";
import { fitnessProducts } from "../db/seed/data/products/fitness";
import { bureauProducts } from "../db/seed/data/products/bureau";
import { promotions } from "../db/seed/data/promotions";
import { guides, guideCategories } from "../db/seed/data/guides";
import { faqs } from "../db/seed/data/faq";
import { pages } from "../db/seed/data/pages";
import { synonyms } from "../db/seed/data/synonyms";
import type { SeedCategory, SeedProduct, SeedTier, PictogramKey, ImageTone } from "../db/seed/types";

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);

const PICTOGRAMS = new Set<PictogramKey>([
  "cup", "bottle", "box", "roll", "bag", "spray", "bucket", "chair", "desk", "mat", "dumbbell", "towel",
  "soap", "plate", "cutlery", "machine", "paper", "gloves", "trash", "dispenser", "lamp", "rack", "tray",
  "container", "broom", "mop", "sign", "glass", "lid", "straw", "napkin", "apron", "bin", "cart", "shelf",
  "monitor", "pen", "notebook", "folder", "printer", "bedding", "pillow", "hanger", "kettle", "kit", "cone",
  "tent", "table", "umbrella", "mask", "kettlebell", "ball", "band", "bench", "scale", "generic",
]);
const TONES = new Set<ImageTone>(["sand", "stone", "sage", "clay", "mist", "olive", "linen", "slate"]);
const FAQ_CATEGORIES = new Set(["commande", "compte", "prix", "livraison", "devis", "paiement", "facturation", "retours", "disponibilite"]);
const PRODUCT_DOC_TYPES = new Set(["DATASHEET", "SAFETY_SHEET", "MANUAL", "CERTIFICATE", "OTHER"]);
const RELATED_TYPES = new Set(["SIMILAR", "FREQUENTLY_BOUGHT", "COMPLEMENTARY", "ACCESSORY"]);

// ---------- Index des référentiels ----------
const attributeCodes = new Set(attributes.map((a) => a.code));
{
  const seen = new Set<string>();
  for (const a of attributes) {
    if (seen.has(a.code)) fail(`attributes: code dupliqué "${a.code}"`);
    seen.add(a.code);
  }
}

const categorySlugs = new Set<string>();
function walkCategories(list: SeedCategory[], path: string) {
  for (const c of list) {
    const p = `${path}/${c.slug}`;
    if (categorySlugs.has(c.slug)) fail(`categories: slug dupliqué "${c.slug}" (${p})`);
    categorySlugs.add(c.slug);
    for (const code of c.attributes ?? []) {
      if (!attributeCodes.has(code)) fail(`categories ${p}: attribut inconnu "${code}"`);
    }
    if (c.children) walkCategories(c.children, p);
  }
}
walkCategories(categories, "");

const brandSlugs = new Set<string>();
for (const b of brands) {
  if (brandSlugs.has(b.slug)) fail(`brands: slug dupliqué "${b.slug}"`);
  brandSlugs.add(b.slug);
}

// ---------- Produits ----------
const fileOf = new Map<SeedProduct, string>();
for (const [name, list] of [
  ["restauration", restaurationProducts],
  ["hotellerie", hotellerieProducts],
  ["hygiene", hygieneProducts],
  ["fitness", fitnessProducts],
  ["bureau", bureauProducts],
] as const) {
  for (const p of list) fileOf.set(p, name);
}
if (fileOf.size !== allProducts.length) fail(`products/index: allProducts (${allProducts.length}) ne couvre pas la somme des fichiers (${fileOf.size})`);

const productBySku = new Map<string, SeedProduct>();
const allSkus = new Set<string>();
const variantParent = new Map<string, SeedProduct>();

for (const p of allProducts) {
  const where = `[${fileOf.get(p) ?? "?"}] ${p.sku}`;
  if (allSkus.has(p.sku)) fail(`${where}: SKU dupliqué`);
  allSkus.add(p.sku);
  productBySku.set(p.sku, p);
  for (const v of p.variants ?? []) {
    if (allSkus.has(v.sku)) fail(`${where}: SKU de variante dupliqué "${v.sku}"`);
    allSkus.add(v.sku);
    variantParent.set(v.sku, p);
  }
}

function checkTiers(where: string, tiers: SeedTier[] | undefined, moq: number, basePrice: number) {
  if (!tiers || tiers.length === 0) return;
  let prevQty = moq;
  let prevPrice = basePrice;
  tiers.forEach((t, i) => {
    if (!Number.isInteger(t.minQuantity) || t.minQuantity <= 0) fail(`${where}: tier[${i}] minQuantity invalide (${t.minQuantity})`);
    if (!Number.isInteger(t.unitPrice) || t.unitPrice <= 0) fail(`${where}: tier[${i}] unitPrice invalide (${t.unitPrice})`);
    if (t.minQuantity <= prevQty) fail(`${where}: tier[${i}] minQuantity ${t.minQuantity} doit être > ${i === 0 ? `moq ${moq}` : `tier[${i - 1}] ${prevQty}`}`);
    if (t.unitPrice >= prevPrice) fail(`${where}: tier[${i}] unitPrice ${t.unitPrice} doit être < ${i === 0 ? `basePrice ${basePrice}` : `tier[${i - 1}] ${prevPrice}`}`);
    prevQty = t.minQuantity;
    prevPrice = t.unitPrice;
  });
}

function checkLorem(where: string, value: unknown) {
  if (typeof value === "string") {
    if (/lorem/i.test(value)) fail(`${where}: contient "lorem"`);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => checkLorem(`${where}[${i}]`, v));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) checkLorem(`${where}.${k}`, v);
  }
}

for (const p of allProducts) {
  const where = `[${fileOf.get(p)}] ${p.sku}`;
  if (!categorySlugs.has(p.categorySlug)) fail(`${where}: categorySlug inconnu "${p.categorySlug}"`);
  if (!brandSlugs.has(p.brandSlug)) fail(`${where}: brandSlug inconnu "${p.brandSlug}"`);
  for (const key of Object.keys(p.attributes ?? {})) {
    if (!attributeCodes.has(key)) fail(`${where}: attribut inconnu "${key}"`);
  }
  if (!PICTOGRAMS.has(p.pictogram)) fail(`${where}: pictogram invalide "${p.pictogram}"`);
  if (!TONES.has(p.tone)) fail(`${where}: tone invalide "${p.tone}"`);
  if (!Number.isInteger(p.moq) || p.moq < 1) fail(`${where}: moq invalide (${p.moq})`);
  if (p.orderMultiple !== undefined && (!Number.isInteger(p.orderMultiple) || p.orderMultiple < 1)) fail(`${where}: orderMultiple invalide (${p.orderMultiple})`);
  if (!Number.isInteger(p.basePrice) || p.basePrice <= 0) fail(`${where}: basePrice invalide (${p.basePrice})`);
  if (p.compareAtPrice !== undefined && p.compareAtPrice <= p.basePrice) fail(`${where}: compareAtPrice ${p.compareAtPrice} doit être > basePrice ${p.basePrice}`);
  if (p.costPrice !== undefined && p.costPrice >= p.basePrice) fail(`${where}: costPrice ${p.costPrice} doit être < basePrice ${p.basePrice}`);
  if (!Number.isInteger(p.stock) || p.stock < 0) fail(`${where}: stock invalide (${p.stock})`);
  if (p.imageCount !== undefined && (p.imageCount < 1 || p.imageCount > 3)) fail(`${where}: imageCount hors 1..3 (${p.imageCount})`);
  if (p.quoteOnlyAbove !== undefined && p.quoteOnlyAbove <= p.moq) fail(`${where}: quoteOnlyAbove ${p.quoteOnlyAbove} doit être > moq ${p.moq}`);
  if (!p.keywords?.length) fail(`${where}: keywords vide`);
  if (!p.description?.trim()) fail(`${where}: description vide`);
  if (!p.shortDescription?.trim()) fail(`${where}: shortDescription vide`);
  if (!p.unitLabel?.trim()) fail(`${where}: unitLabel vide`);
  if (!p.tiers) fail(`${where}: tiers manquant`);
  checkTiers(where, p.tiers, p.moq, p.basePrice);

  for (const d of p.documents ?? []) {
    if (!PRODUCT_DOC_TYPES.has(d.type)) fail(`${where}: type de document invalide "${d.type}"`);
  }
  for (const r of p.related ?? []) {
    if (!allSkus.has(r.sku)) fail(`${where}: related SKU inconnu "${r.sku}"`);
    if (r.sku === p.sku) fail(`${where}: related pointe vers lui-même`);
    if (!RELATED_TYPES.has(r.type)) fail(`${where}: related type invalide "${r.type}"`);
  }
  const relSeen = new Set<string>();
  for (const r of p.related ?? []) {
    if (relSeen.has(r.sku)) fail(`${where}: related SKU "${r.sku}" en double`);
    relSeen.add(r.sku);
  }

  for (const v of p.variants ?? []) {
    const vw = `${where} / variante ${v.sku}`;
    const vBase = v.basePrice ?? p.basePrice;
    if (v.basePrice !== undefined && (!Number.isInteger(v.basePrice) || v.basePrice <= 0)) fail(`${vw}: basePrice invalide (${v.basePrice})`);
    if (v.compareAtPrice !== undefined && v.compareAtPrice <= vBase) fail(`${vw}: compareAtPrice ${v.compareAtPrice} doit être > basePrice ${vBase}`);
    if (v.stock !== undefined && (!Number.isInteger(v.stock) || v.stock < 0)) fail(`${vw}: stock invalide (${v.stock})`);
    if (!v.options || Object.keys(v.options).length === 0) fail(`${vw}: options vide`);
    checkTiers(vw, v.tiers, p.moq, vBase);
  }
  checkLorem(where, p);
}

// ---------- Promotions ----------
promotions.forEach((pr, i) => {
  const where = `promotions[${i}] "${pr.name}"`;
  for (const sku of pr.productSkus ?? []) {
    if (!allSkus.has(sku)) fail(`${where}: productSku inconnu "${sku}"`);
  }
  for (const slug of pr.categorySlugs ?? []) if (!categorySlugs.has(slug)) fail(`${where}: categorySlug inconnu "${slug}"`);
  for (const slug of pr.brandSlugs ?? []) if (!brandSlugs.has(slug)) fail(`${where}: brandSlug inconnu "${slug}"`);
  if (pr.scope === "PRODUCT" && !pr.productSkus?.length) fail(`${where}: scope PRODUCT sans productSkus`);
  if (pr.scope === "CATEGORY" && !pr.categorySlugs?.length) fail(`${where}: scope CATEGORY sans categorySlugs`);
  if (pr.scope === "BRAND" && !pr.brandSlugs?.length) fail(`${where}: scope BRAND sans brandSlugs`);
  if (pr.type === "PERCENTAGE" && (pr.valueBps === undefined || pr.valueBps <= 0 || pr.valueBps > 10000)) fail(`${where}: valueBps invalide`);
  if (pr.type === "FIXED_AMOUNT" && (pr.valueAmount === undefined || pr.valueAmount <= 0)) fail(`${where}: valueAmount invalide`);
  if (pr.type === "QUANTITY" && (pr.minQuantity === undefined || pr.minQuantity < 2)) fail(`${where}: minQuantity invalide pour QUANTITY`);
  if ((pr.type === "SPECIAL_PRICE" || pr.type === "CLEARANCE") && pr.specialPrice === undefined) fail(`${where}: specialPrice manquant`);
  if (pr.specialPrice !== undefined) {
    if (pr.specialPrice <= 0) fail(`${where}: specialPrice invalide (${pr.specialPrice})`);
    for (const sku of pr.productSkus ?? []) {
      const parent = productBySku.get(sku) ?? variantParent.get(sku);
      if (!parent) continue;
      const variant = parent.variants?.find((v) => v.sku === sku);
      const base = variant?.basePrice ?? parent.basePrice;
      if (pr.specialPrice >= base) fail(`${where}: specialPrice ${pr.specialPrice} doit être < basePrice ${base} de ${sku}`);
    }
  }
  if (pr.isAutomatic === false && !pr.couponCodes?.length) fail(`${where}: promotion manuelle sans couponCodes`);
  checkLorem(where, pr);
});

// ---------- Guides ----------
const guideCategorySlugs = new Set(guideCategories.map((g) => g.slug));
const guideSlugs = new Set<string>();
for (const g of guides) {
  const where = `guides "${g.slug}"`;
  if (guideSlugs.has(g.slug)) fail(`${where}: slug dupliqué`);
  guideSlugs.add(g.slug);
  if (!guideCategorySlugs.has(g.categorySlug)) fail(`${where}: categorySlug de guide inconnu "${g.categorySlug}"`);
  for (const sku of g.relatedSkus) if (!allSkus.has(sku)) fail(`${where}: relatedSku inconnu "${sku}"`);
  if (!PICTOGRAMS.has(g.pictogram)) fail(`${where}: pictogram invalide "${g.pictogram}"`);
  if (!TONES.has(g.tone)) fail(`${where}: tone invalide "${g.tone}"`);
  if (!(g.readingMinutes > 0)) fail(`${where}: readingMinutes invalide`);
  if (!g.content?.trim()) fail(`${where}: content vide`);
  checkLorem(where, g);
}

// ---------- Secteurs ----------
const sectorSlugs = new Set<string>();
for (const s of sectors) {
  const where = `sectors "${s.slug}"`;
  if (sectorSlugs.has(s.slug)) fail(`${where}: slug dupliqué`);
  sectorSlugs.add(s.slug);
  for (const slug of s.categorySlugs) if (!categorySlugs.has(slug)) fail(`${where}: categorySlug inconnu "${slug}"`);
  if (s.featuredSkus.length < 6 || s.featuredSkus.length > 8) fail(`${where}: featuredSkus doit contenir 6 à 8 SKUs (${s.featuredSkus.length})`);
  // Sous-arbre de catégories couvert par le secteur (pour vérifier la pertinence des SKUs mis en avant).
  const subtree = new Set<string>();
  const collect = (list: SeedCategory[], inside: boolean) => {
    for (const c of list) {
      const on = inside || s.categorySlugs.includes(c.slug);
      if (on) subtree.add(c.slug);
      if (c.children) collect(c.children, on);
    }
  };
  collect(categories, false);
  const seen = new Set<string>();
  for (const sku of s.featuredSkus) {
    if (!allSkus.has(sku)) fail(`${where}: featuredSku inconnu "${sku}"`);
    if (seen.has(sku)) fail(`${where}: featuredSku "${sku}" en double`);
    seen.add(sku);
    const owner = productBySku.get(sku) ?? variantParent.get(sku);
    if (owner && !subtree.has(owner.categorySlug)) fail(`${where}: featuredSku "${sku}" hors des catégories du secteur (${owner.categorySlug})`);
  }
  checkLorem(where, s);
}

// ---------- FAQ, pages, synonymes, catégories, marques ----------
faqs.forEach((f, i) => {
  if (!FAQ_CATEGORIES.has(f.category)) fail(`faq[${i}]: catégorie invalide "${f.category}"`);
  checkLorem(`faq[${i}]`, f);
});
{
  const seen = new Set<string>();
  for (const pg of pages) {
    if (seen.has(pg.slug)) fail(`pages: slug dupliqué "${pg.slug}"`);
    seen.add(pg.slug);
    if (!pg.content?.trim()) fail(`pages "${pg.slug}": content vide`);
    checkLorem(`pages "${pg.slug}"`, pg);
  }
}
{
  const seen = new Set<string>();
  for (const s of synonyms) {
    if (seen.has(s.term)) fail(`synonyms: terme dupliqué "${s.term}"`);
    seen.add(s.term);
    if (!s.synonyms.length) fail(`synonyms "${s.term}": liste vide`);
    checkLorem(`synonyms "${s.term}"`, s);
  }
}
checkLorem("categories", categories);
checkLorem("brands", brands);
checkLorem("attributes", attributes);

// ---------- Rapport ----------
const stats = `produits=${allProducts.length} skus=${allSkus.size} catégories=${categorySlugs.size} marques=${brandSlugs.size} promotions=${promotions.length} guides=${guides.length} secteurs=${sectors.length}`;
if (problems.length) {
  console.error(`${problems.length} problème(s) détecté(s) (${stats}) :`);
  for (const p of problems) console.error(` - ${p}`);
  process.exit(1);
}
console.log(`OK, aucun problème (${stats})`);
