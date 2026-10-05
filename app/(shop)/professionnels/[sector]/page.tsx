import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, FileText } from "lucide-react";
import { getT } from "@/i18n/server";
import { getPricingContext } from "@/lib/auth/dal";
import { getSectorBySlug } from "@/services/catalog/sectors";
import { getCategoryMap } from "@/services/catalog/categories";
import { getProductsByIds, getProductsInCategories } from "@/services/catalog/products";
import { Section, SectionHeader } from "@/components/layout/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ProductRail } from "@/components/commerce/product-grid";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";

type Props = { params: Promise<{ sector: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sector = await getSectorBySlug((await params).sector);
  if (!sector) return {};
  return { title: sector.seoTitle ? { absolute: sector.seoTitle } : sector.name, description: sector.seoDescription ?? sector.description ?? undefined, alternates: { canonical: sector.href } };
}

export default async function SectorPage({ params }: Props) {
  const [{ sector: slug }, t, ctx] = await Promise.all([params, getT(), getPricingContext()]);
  const sector = await getSectorBySlug(slug);
  if (!sector) notFound();
  const map = await getCategoryMap();
  const categories = sector.categoryIds.map((id) => map.get(id)).filter((c): c is NonNullable<typeof c> => !!c);
  const [featured, popular] = await Promise.all([getProductsByIds(sector.featuredProductIds, ctx), getProductsInCategories(sector.categoryIds, ctx, 8)]);
  const crumbs = [{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("catalog.sectors.title"), href: "/professionnels" }, { label: sector.name }];
  const popularFiltered = popular.filter((p) => !featured.some((f) => f.id === p.id));

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <section className="border-b border-border bg-surface">
        <div className="container-site grid items-center gap-8 py-8 md:grid-cols-2 md:py-14">
          <div>
            <Breadcrumb items={crumbs} label={t("common.breadcrumb.label")} className="mb-5" />
            <h1 className="t-display text-balance">{sector.heroTitle}</h1>
            {sector.heroSubtitle && <p className="t-body-lg mt-4 max-w-lg text-muted">{sector.heroSubtitle}</p>}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><a href="#categories">{t("catalog.sectors.heroCta")}<ArrowRight className="rtl:rotate-180" /></a></Button>
              <Button asChild size="lg" variant="outline"><Link href="/quote"><FileText />{t("catalog.sectors.heroQuote")}</Link></Button>
            </div>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-paper-2">
            <Image src={sector.image ?? `/images/sectors/${sector.slug}.svg`} alt={sector.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" loading="eager" fetchPriority="high" />
          </div>
        </div>
      </section>

      <Section className="scroll-mt-28" >
        <div id="categories" />
        <SectionHeader title={t("catalog.sectors.categoriesTitle")} subtitle={sector.description} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={c.href} className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-ink">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-paper-2">
                  <Image src={c.image ?? `/images/categories/${c.slug}.svg`} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold group-hover:text-accent">{c.name}</span>
                  <span className="block text-xs text-muted">{t("catalog.sectors.productsCount", { count: c.productCount })}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {featured.length > 0 && (
        <Section bordered>
          <SectionHeader title={t("catalog.sectors.selectionTitle")} />
          <ProductRail products={featured} listId={`sector_${sector.slug}_featured`} />
        </Section>
      )}
      {popularFiltered.length > 0 && (
        <Section bordered>
          <SectionHeader title={t("catalog.sectors.popularTitle")} />
          <ProductRail products={popularFiltered.slice(0, 8)} listId={`sector_${sector.slug}_popular`} />
        </Section>
      )}

      <section className="container-site py-6 md:py-10">
        <div className="rounded-xl bg-accent px-6 py-8 text-white md:px-10 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="t-h2">{t("catalog.sectors.quoteTitle")}</h2>
              <p className="mt-2 text-white/85">{t("catalog.sectors.quoteDesc")}</p>
            </div>
            <Button asChild size="lg" variant="secondary" className="bg-white text-ink hover:bg-paper"><Link href="/quote"><FileText />{t("common.actions.requestQuote")}</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
