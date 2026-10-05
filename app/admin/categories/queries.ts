import "server-only";
import { db } from "@/lib/db";
import type { CategoryTreeRow } from "@/components/admin/category-tree";

/** Catégories en ordre d'arbre (parents avant enfants, tri ordre puis nom) avec comptages. */
export async function loadCategoryTree(): Promise<CategoryTreeRow[]> {
  const rows = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true, children: true } } } });
  const children = new Map<string | null, typeof rows>();
  for (const r of rows) (children.get(r.parentId) ?? children.set(r.parentId, []).get(r.parentId)!).push(r);
  const out: CategoryTreeRow[] = [];
  const walk = (parentId: string | null) => {
    for (const r of children.get(parentId) ?? []) {
      out.push({ id: r.id, name: r.name, slug: r.slug, path: r.path, level: r.level, sortOrder: r.sortOrder, isVisible: r.isVisible, showInNav: r.showInNav, productCount: r._count.products, childCount: r._count.children });
      walk(r.id);
    }
  };
  walk(null);
  return out;
}

export async function loadCategoryFormRefs() {
  const [tree, attributes] = await Promise.all([loadCategoryTree(), db.attribute.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, code: true, name: true } })]);
  const parents = await db.category.findMany({ select: { id: true, parentId: true } });
  const parentOf = new Map(parents.map((p) => [p.id, p.parentId]));
  return { categories: tree.map((c) => ({ id: c.id, name: c.name, level: c.level, parentId: parentOf.get(c.id) ?? null })), attributes };
}
