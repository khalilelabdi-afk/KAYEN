import "server-only";
import { db, type Prisma } from "@/lib/db";
import type { ProductRefs } from "@/components/admin/product-form-types";

/** Include Prisma du produit pour le formulaire d'édition. */
export const productFormInclude = {
  options: true,
  images: true,
  variants: { include: { optionValues: true, priceTiers: true, inventory: true } },
  attributes: true,
  documents: true,
  faqs: true,
  relations: { include: { target: { select: { sku: true, name: true } } } },
} satisfies Prisma.ProductInclude;

/** Catégories ordonnées en parcours d'arbre (parents avant enfants, tri par ordre puis nom). */
export async function loadCategoryOptions(): Promise<{ id: string; name: string; level: number; path: string; parentId: string | null }[]> {
  const rows = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, level: true, path: true, parentId: true } });
  const children = new Map<string | null, typeof rows>();
  for (const r of rows) (children.get(r.parentId) ?? children.set(r.parentId, []).get(r.parentId)!).push(r);
  const out: typeof rows = [];
  const walk = (parentId: string | null) => { for (const r of children.get(parentId) ?? []) { out.push(r); walk(r.id); } };
  walk(null);
  return out;
}

/** Référentiels du formulaire produit. */
export async function loadProductRefs(): Promise<ProductRefs> {
  const [categories, brands, taxClasses, attributes] = await Promise.all([
    loadCategoryOptions(),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.taxClass.findMany({ orderBy: { rateBps: "desc" }, select: { id: true, name: true, rateBps: true } }),
    db.attribute.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, code: true, name: true, type: true, unit: true } }),
  ]);
  return { categories, brands, taxClasses, attributes };
}
