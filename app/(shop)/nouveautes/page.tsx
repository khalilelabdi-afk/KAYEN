import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { parseListingParams, type RawSearchParams } from "@/lib/catalog/listing-params";
import { ProductListing } from "@/components/catalog/product-listing";
import { CatalogPageHeader } from "@/components/catalog/page-header";
import { Section } from "@/components/layout/section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("catalog.plp.newArrivalsTitle"), description: t("catalog.plp.newArrivalsDesc"), alternates: { canonical: "/nouveautes" } };
}

export default async function NewArrivalsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const params = parseListingParams(sp, "newest");
  return (
    <Section className="py-6 md:py-10">
      <CatalogPageHeader crumbs={[{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("catalog.plp.newArrivalsTitle") }]} breadcrumbLabel={t("common.breadcrumb.label")} title={t("catalog.plp.newArrivalsTitle")} description={t("catalog.plp.newArrivalsDesc")} />
      <ProductListing scope={{ onlyNew: true }} params={params} basePath="/nouveautes" listId="new_arrivals" defaultSort="newest" sortOptions={["newest", "popular", "price_asc", "price_desc", "promo"]} />
    </Section>
  );
}
