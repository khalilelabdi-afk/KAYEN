import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { getPricingContext } from "@/lib/auth/dal";
import { getHomeSections } from "@/services/cms";
import { getCategoryTree } from "@/services/catalog/categories";
import { getSectors } from "@/services/catalog/sectors";
import { getFeaturedBrands } from "@/services/catalog/brands";
import { getBestsellers, getNewArrivals, getPromotedProducts, getProductsBySkus } from "@/services/catalog/products";
import { getGuides } from "@/services/cms";
import { getSettings } from "@/services/settings";
import { getNavData } from "@/components/layout/site-shell";
import { Hero } from "@/components/home/hero";
import { SectorsSection } from "@/components/home/sectors";
import { CategoriesSection } from "@/components/home/categories";
import { BenefitsSection } from "@/components/home/benefits";
import { ProductSection } from "@/components/home/product-section";
import { QuoteBanner, BrandsStrip, GuidesSection } from "@/components/home/banners";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import { siteConfig } from "@/lib/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: { absolute: t("common.meta.defaultTitle") }, description: t("common.meta.defaultDescription"), alternates: { canonical: "/" } };
}

export default async function HomePage() {
  const [t, ctx, sections, settings] = await Promise.all([getT(), getPricingContext(), getHomeSections(), getSettings()]);
  const nav = await getNavData();

  const rendered = await Promise.all(
    sections.map(async (s) => {
      const limit = s.config.limit;
      switch (s.type) {
        case "HERO":
          return <Hero key={s.id} categories={nav.categories} title={s.title} subtitle={s.subtitle} />;
        case "SECTORS":
          return <SectorsSection key={s.id} sectors={await getSectors()} title={s.title} subtitle={s.subtitle} limit={limit ?? 8} />;
        case "CATEGORIES": {
          const tree = await getCategoryTree();
          const picked = s.config.categorySlugs?.length ? tree.filter((c) => s.config.categorySlugs!.includes(c.slug)) : tree;
          return <CategoriesSection key={s.id} categories={picked} title={s.title} subtitle={s.subtitle} limit={limit ?? 12} />;
        }
        case "BESTSELLERS":
          return <ProductSection key={s.id} id="home_bestsellers" title={s.title ?? t("home.bestsellers.title")} subtitle={s.subtitle ?? t("home.bestsellers.subtitle")} cta={{ label: s.ctaLabel ?? t("home.bestsellers.cta"), href: s.ctaHref ?? "/c?sort=bestsellers" }} products={await getBestsellers(ctx, limit ?? 8)} />;
        case "PROMOTIONS":
          return <ProductSection key={s.id} id="home_promotions" title={s.title ?? t("home.promotions.title")} subtitle={s.subtitle ?? t("home.promotions.subtitle")} cta={{ label: s.ctaLabel ?? t("home.promotions.cta"), href: s.ctaHref ?? "/promotions" }} products={await getPromotedProducts(ctx, limit ?? 8)} bordered />;
        case "NEW_ARRIVALS":
          return <ProductSection key={s.id} id="home_new" title={s.title ?? t("home.newArrivals.title")} subtitle={s.subtitle ?? t("home.newArrivals.subtitle")} cta={{ label: s.ctaLabel ?? t("home.newArrivals.cta"), href: s.ctaHref ?? "/nouveautes" }} products={await getNewArrivals(ctx, limit ?? 8)} bordered />;
        case "COLLECTION":
          return <ProductSection key={s.id} id={`home_${s.id}`} title={s.title ?? ""} subtitle={s.subtitle} cta={s.ctaLabel && s.ctaHref ? { label: s.ctaLabel, href: s.ctaHref } : null} products={await getProductsBySkus(s.config.productSkus ?? [], ctx)} bordered />;
        case "BENEFITS":
          return <BenefitsSection key={s.id} />;
        case "BANNER":
          return <QuoteBanner key={s.id} title={s.title} subtitle={s.subtitle} ctaLabel={s.ctaLabel} ctaHref={s.ctaHref} variant={s.config.variant} />;
        case "BRANDS":
          return <BrandsStrip key={s.id} brands={await getFeaturedBrands(limit ?? 6)} title={s.title} />;
        case "GUIDES":
          return <GuidesSection key={s.id} guides={await getGuides(limit ?? 3)} title={s.title} />;
        default:
          return null;
      }
    }),
  );

  return (
    <>
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd()]} />
      {rendered}
      <p className="sr-only">{siteConfig.tagline}</p>
    </>
  );
}
