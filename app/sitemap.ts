import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const [products, categories, brands, sectors, guides, pages] = await Promise.all([
    db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ where: { isVisible: true }, select: { path: true, updatedAt: true } }),
    db.brand.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    db.sector.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    db.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.cmsPage.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
  ]);
  const staticRoutes = ["", "/c", "/brands", "/professionnels", "/promotions", "/nouveautes", "/guides", "/quote", "/about", "/contact", "/faq", "/quick-order"];
  return [
    ...staticRoutes.map((r) => ({ url: `${base}${r}`, changeFrequency: "daily" as const, priority: r === "" ? 1 : 0.7 })),
    ...categories.map((c) => ({ url: `${base}/c/${c.path}`, lastModified: c.updatedAt, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/p/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...brands.map((b) => ({ url: `${base}/brand/${b.slug}`, lastModified: b.updatedAt, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...sectors.map((s) => ({ url: `${base}/professionnels/${s.slug}`, lastModified: s.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...guides.map((g) => ({ url: `${base}/guides/${g.slug}`, lastModified: g.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...pages.map((p) => ({ url: `${base}/pages/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
