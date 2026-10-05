import "server-only";
import { db } from "@/lib/db";
import type { PromotionRefs } from "@/components/admin/promotion-form";

/** Référentiels du formulaire promotion : catégories (ordre d'arbre), marques, groupes clients. */
export async function loadPromotionRefs(): Promise<PromotionRefs> {
  const [categories, brands, groups] = await Promise.all([
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, level: true, parentId: true } }),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.customerGroup.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const children = new Map<string | null, typeof categories>();
  for (const c of categories) (children.get(c.parentId) ?? children.set(c.parentId, []).get(c.parentId)!).push(c);
  const ordered: { id: string; name: string; level: number }[] = [];
  const walk = (parentId: string | null) => { for (const c of children.get(parentId) ?? []) { ordered.push({ id: c.id, name: c.name, level: c.level }); walk(c.id); } };
  walk(null);
  return { categories: ordered, brands, groups };
}
