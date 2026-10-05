import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const CMS_TAG = "cms";

export interface HomeSectionConfig {
  limit?: number;
  productSkus?: string[];
  categorySlugs?: string[];
  sectorSlugs?: string[];
  variant?: string;
}

export interface HomeSectionView {
  id: string;
  type: "HERO" | "SECTORS" | "CATEGORIES" | "BESTSELLERS" | "PROMOTIONS" | "NEW_ARRIVALS" | "BENEFITS" | "BANNER" | "COLLECTION" | "BRANDS" | "GUIDES";
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  image: string | null;
  config: HomeSectionConfig;
}

/** Sections par défaut si le back-office n'en définit aucune. */
export const defaultHomeSections: HomeSectionView[] = [
  { id: "hero", type: "HERO", title: null, subtitle: null, ctaLabel: null, ctaHref: null, image: null, config: {} },
  { id: "sectors", type: "SECTORS", title: null, subtitle: null, ctaLabel: null, ctaHref: null, image: null, config: { limit: 8 } },
  { id: "categories", type: "CATEGORIES", title: null, subtitle: null, ctaLabel: null, ctaHref: null, image: null, config: { limit: 12 } },
  { id: "bestsellers", type: "BESTSELLERS", title: null, subtitle: null, ctaLabel: null, ctaHref: null, image: null, config: { limit: 8 } },
  { id: "benefits", type: "BENEFITS", title: null, subtitle: null, ctaLabel: null, ctaHref: null, image: null, config: {} },
  { id: "promotions", type: "PROMOTIONS", title: null, subtitle: null, ctaLabel: null, ctaHref: null, image: null, config: { limit: 8 } },
  { id: "new", type: "NEW_ARRIVALS", title: null, subtitle: null, ctaLabel: null, ctaHref: null, image: null, config: { limit: 8 } },
  { id: "quote", type: "BANNER", title: null, subtitle: null, ctaLabel: null, ctaHref: "/quote", image: null, config: { variant: "quote" } },
  { id: "brands", type: "BRANDS", title: null, subtitle: null, ctaLabel: null, ctaHref: null, image: null, config: { limit: 8 } },
  { id: "guides", type: "GUIDES", title: null, subtitle: null, ctaLabel: null, ctaHref: null, image: null, config: { limit: 3 } },
];

export const getHomeSections = unstable_cache(
  async (): Promise<HomeSectionView[]> => {
    const rows = await db.homeSection.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
    if (!rows.length) return defaultHomeSections;
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      subtitle: r.subtitle,
      ctaLabel: r.ctaLabel,
      ctaHref: r.ctaHref,
      image: r.image,
      config: (r.config as HomeSectionConfig | null) ?? {},
    }));
  },
  ["home-sections"],
  { tags: [CMS_TAG], revalidate: 300 },
);

export const getPageBySlug = unstable_cache(
  async (slug: string) => db.cmsPage.findFirst({ where: { slug, status: "PUBLISHED" } }),
  ["cms-page"],
  { tags: [CMS_TAG], revalidate: 600 },
);

export const getFooterPages = unstable_cache(
  async () => db.cmsPage.findMany({ where: { status: "PUBLISHED", showInFooter: true }, select: { slug: true, title: true }, orderBy: { title: "asc" } }),
  ["cms-footer-pages"],
  { tags: [CMS_TAG], revalidate: 600 },
);

export const getFaqs = unstable_cache(
  async () => db.faq.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
  ["faqs"],
  { tags: [CMS_TAG], revalidate: 600 },
);

export interface GuideSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  category: { slug: string; name: string } | null;
  authorName: string | null;
  readingMinutes: number;
  publishedAt: Date | null;
  href: string;
}

export const getGuides = unstable_cache(
  async (limit?: number, categorySlug?: string): Promise<GuideSummary[]> => {
    const rows = await db.blogPost.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() }, ...(categorySlug ? { category: { slug: categorySlug } } : {}) },
      orderBy: { publishedAt: "desc" },
      take: limit,
      include: { category: { select: { slug: true, name: true } } },
    });
    return rows.map((r) => ({ id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, image: r.image, category: r.category, authorName: r.authorName, readingMinutes: r.readingMinutes, publishedAt: r.publishedAt, href: `/guides/${r.slug}` }));
  },
  ["guides"],
  { tags: [CMS_TAG], revalidate: 600 },
);

export const getGuideCategories = unstable_cache(
  async () => db.blogCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ["guide-categories"],
  { tags: [CMS_TAG], revalidate: 600 },
);

export async function getGuideBySlug(slug: string) {
  return db.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { category: true, products: { orderBy: { sortOrder: "asc" }, select: { productId: true } } },
  });
}
