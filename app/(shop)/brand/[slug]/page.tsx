import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { getBrandBySlug } from "@/services/catalog/brands";
import { parseListingParams, type RawSearchParams } from "@/lib/catalog/listing-params";
import { ProductListing } from "@/components/catalog/product-listing";
import { CatalogPageHeader } from "@/components/catalog/page-header";
import { Section } from "@/components/layout/section";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = await getBrandBySlug((await params).slug);
  if (!brand) return {};
  return { title: brand.name, description: brand.description ?? undefined, alternates: { canonical: brand.href } };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const [{ slug }, sp, t] = await Promise.all([params, searchParams, getT()]);
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();
  const listing = parseListingParams(sp, "popular");
  return (
    <Section className="py-6 md:py-10">
      <CatalogPageHeader crumbs={[{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("catalog.brands.title"), href: "/brands" }, { label: brand.name }]} breadcrumbLabel={t("common.breadcrumb.label")} title={t("catalog.brands.brandProducts", { brand: brand.name })} description={brand.description}>
        {brand.logo && (
          <div className="mt-4 inline-flex rounded-lg border border-border bg-surface p-3">
            <Image src={brand.logo} alt={brand.name} width={200} height={100} className="h-12 w-auto object-contain" />
          </div>
        )}
      </CatalogPageHeader>
      <ProductListing scope={{ brandId: brand.id }} params={listing} basePath={brand.href} listId={`brand_${brand.slug}`} defaultSort="popular" sortOptions={["popular", "price_asc", "price_desc", "newest", "promo", "bestsellers", "name_asc"]} />
    </Section>
  );
}
