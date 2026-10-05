import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const BRANDS_TAG = "brands";

export interface BrandSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  isFeatured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  productCount: number;
  href: string;
}

export const getBrands = unstable_cache(
  async (): Promise<BrandSummary[]> => {
    const rows = await db.brand.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
    });
    return rows.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      description: b.description,
      logo: b.logo,
      website: b.website,
      isFeatured: b.isFeatured,
      seoTitle: b.seoTitle,
      seoDescription: b.seoDescription,
      productCount: b._count.products,
      href: `/brand/${b.slug}`,
    }));
  },
  ["brands"],
  { tags: [BRANDS_TAG, "products"], revalidate: 600 },
);

export async function getBrandBySlug(slug: string): Promise<BrandSummary | null> {
  return (await getBrands()).find((b) => b.slug === slug) ?? null;
}

export async function getFeaturedBrands(limit = 8): Promise<BrandSummary[]> {
  const brands = await getBrands();
  const featured = brands.filter((b) => b.isFeatured);
  return (featured.length ? featured : brands).slice(0, limit);
}
