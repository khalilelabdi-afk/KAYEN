import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const CATEGORIES_TAG = "categories";
export const PRODUCTS_TAG = "products";

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  parentId: string | null;
  path: string;
  level: number;
  sortOrder: number;
  isVisible: boolean;
  showInNav: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface CategoryNode extends CategoryRow {
  children: CategoryNode[];
  /** Produits actifs dans la catégorie et ses descendants. */
  productCount: number;
  href: string;
}

export function categoryHref(path: string) {
  return `/c/${path}`;
}

/** Toutes les catégories (visibles ou non) — petite table, cache partagé. */
export const getAllCategories = unstable_cache(
  async (): Promise<CategoryRow[]> =>
    db.category.findMany({
      orderBy: [{ level: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true, slug: true, name: true, description: true, image: true, icon: true, parentId: true, path: true,
        level: true, sortOrder: true, isVisible: true, showInNav: true, seoTitle: true, seoDescription: true,
      },
    }),
  ["all-categories"],
  { tags: [CATEGORIES_TAG], revalidate: 600 },
);

/** Comptage de produits actifs par catégorie (directs). */
export const getProductCountsByCategory = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const rows = await db.product.groupBy({ by: ["categoryId"], where: { status: "ACTIVE" }, _count: { _all: true } });
    return Object.fromEntries(rows.map((r) => [r.categoryId, r._count._all]));
  },
  ["category-product-counts"],
  { tags: [CATEGORIES_TAG, PRODUCTS_TAG], revalidate: 300 },
);

/** Arbre complet des catégories visibles avec comptages agrégés. */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const [rows, counts] = await Promise.all([getAllCategories(), getProductCountsByCategory()]);
  const nodes = new Map<string, CategoryNode>();
  for (const row of rows) {
    if (!row.isVisible) continue;
    nodes.set(row.id, { ...row, children: [], productCount: counts[row.id] ?? 0, href: categoryHref(row.path) });
  }
  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) nodes.get(node.parentId)!.children.push(node);
    else if (!node.parentId) roots.push(node);
  }
  const aggregate = (node: CategoryNode): number => {
    node.children.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    node.productCount += node.children.reduce((s, c) => s + aggregate(c), 0);
    return node.productCount;
  };
  roots.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  roots.forEach(aggregate);
  return roots;
}

function flatten(nodes: CategoryNode[], out: CategoryNode[] = []): CategoryNode[] {
  for (const n of nodes) {
    out.push(n);
    flatten(n.children, out);
  }
  return out;
}

export async function getCategoryMap(): Promise<Map<string, CategoryNode>> {
  const tree = await getCategoryTree();
  return new Map(flatten(tree).map((n) => [n.id, n]));
}

export async function getCategoryByPath(path: string): Promise<CategoryNode | null> {
  const map = await getCategoryMap();
  for (const node of map.values()) if (node.path === path) return node;
  return null;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryNode | null> {
  const map = await getCategoryMap();
  for (const node of map.values()) if (node.slug === slug) return node;
  return null;
}

export async function getCategoryById(id: string): Promise<CategoryNode | null> {
  return (await getCategoryMap()).get(id) ?? null;
}

/** Ids de la catégorie et de tous ses ancêtres (pour les promotions). */
export async function getCategoryAncestorIds(categoryId: string): Promise<string[]> {
  const rows = await getAllCategories();
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: string[] = [];
  let current = byId.get(categoryId);
  while (current) {
    out.push(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return out;
}

/** Ids de la catégorie et de tous ses descendants (pour les listings). */
export async function getCategoryDescendantIds(categoryId: string): Promise<string[]> {
  const rows = await getAllCategories();
  const children = new Map<string, string[]>();
  for (const r of rows) {
    if (r.parentId) (children.get(r.parentId) ?? children.set(r.parentId, []).get(r.parentId)!).push(r.id);
  }
  const out: string[] = [];
  const stack = [categoryId];
  while (stack.length) {
    const id = stack.pop()!;
    out.push(id);
    stack.push(...(children.get(id) ?? []));
  }
  return out;
}

/** Fil d'Ariane d'une catégorie (de la racine à la catégorie). */
export async function getCategoryBreadcrumb(categoryId: string): Promise<CategoryNode[]> {
  const map = await getCategoryMap();
  const chain: CategoryNode[] = [];
  let current = map.get(categoryId);
  while (current) {
    chain.unshift(current);
    current = current.parentId ? map.get(current.parentId) : undefined;
  }
  return chain;
}

/** Catégories racines affichées dans la navigation (avec enfants). */
export async function getNavCategories(): Promise<CategoryNode[]> {
  const tree = await getCategoryTree();
  return tree.filter((c) => c.showInNav);
}

/** Attributs filtrables d'une catégorie (hérités des ancêtres si la catégorie n'en définit pas). */
export async function getCategoryFilterAttributes(categoryId: string) {
  const ancestors = await getCategoryAncestorIds(categoryId);
  const rows = await db.categoryAttribute.findMany({
    where: { categoryId: { in: ancestors }, isFilter: true },
    include: { attribute: true },
    orderBy: { sortOrder: "asc" },
  });
  const seen = new Set<string>();
  const out: { id: string; code: string; name: string; type: string; unit: string | null }[] = [];
  for (const id of ancestors) {
    for (const row of rows.filter((r) => r.categoryId === id)) {
      if (seen.has(row.attributeId)) continue;
      seen.add(row.attributeId);
      out.push({ id: row.attribute.id, code: row.attribute.code, name: row.attribute.name, type: row.attribute.type, unit: row.attribute.unit });
    }
  }
  return out;
}
