import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const SECTORS_TAG = "sectors";

export interface SectorSummary {
  id: string;
  slug: string;
  name: string;
  heroTitle: string;
  heroSubtitle: string | null;
  description: string | null;
  image: string | null;
  icon: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  href: string;
  categoryIds: string[];
  featuredProductIds: string[];
}

export const getSectors = unstable_cache(
  async (): Promise<SectorSummary[]> => {
    const rows = await db.sector.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        categories: { orderBy: { sortOrder: "asc" }, select: { categoryId: true } },
        products: { orderBy: { sortOrder: "asc" }, select: { productId: true } },
      },
    });
    return rows.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      heroTitle: s.heroTitle,
      heroSubtitle: s.heroSubtitle,
      description: s.description,
      image: s.image,
      icon: s.icon,
      seoTitle: s.seoTitle,
      seoDescription: s.seoDescription,
      href: `/professionnels/${s.slug}`,
      categoryIds: s.categories.map((c) => c.categoryId),
      featuredProductIds: s.products.map((p) => p.productId),
    }));
  },
  ["sectors"],
  { tags: [SECTORS_TAG], revalidate: 600 },
);

export async function getSectorBySlug(slug: string): Promise<SectorSummary | null> {
  return (await getSectors()).find((s) => s.slug === slug) ?? null;
}
