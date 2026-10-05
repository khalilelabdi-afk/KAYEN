import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { parseListingParams, type RawSearchParams } from "@/lib/catalog/listing-params";
import { ProductListing } from "@/components/catalog/product-listing";
import { CatalogPageHeader } from "@/components/catalog/page-header";
import { Section } from "@/components/layout/section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("catalog.plp.promotionsTitle"), description: t("catalog.plp.promotionsDesc"), alternates: { canonical: "/promotions" } };
}

export default async function PromotionsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const params = parseListingParams(sp, "popular");
  return (
    <Section className="py-6 md:py-10">
      <CatalogPageHeader crumbs={[{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("catalog.plp.promotionsTitle") }]} breadcrumbLabel={t("common.breadcrumb.label")} title={t("catalog.plp.promotionsTitle")} description={t("catalog.plp.promotionsDesc")} />
      <ProductListing scope={{ onlyPromo: true }} params={params} basePath="/promotions" listId="promotions" defaultSort="popular" sortOptions={["popular", "price_asc", "price_desc", "newest", "bestsellers"]} />
    </Section>
  );
}
