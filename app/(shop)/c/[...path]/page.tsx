import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { getCategoryByPath, getCategoryBreadcrumb } from "@/services/catalog/categories";
import { parseListingParams, type RawSearchParams } from "@/lib/catalog/listing-params";
import { ProductListing } from "@/components/catalog/product-listing";
import { CatalogPageHeader } from "@/components/catalog/page-header";
import { Section } from "@/components/layout/section";

type Props = { params: Promise<{ path: string[] }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path } = await params;
  const category = await getCategoryByPath(path.join("/"));
  if (!category) return {};
  return {
    title: category.seoTitle ?? category.name,
    description: category.seoDescription ?? category.description ?? undefined,
    alternates: { canonical: category.href },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ path }, sp, t] = await Promise.all([params, searchParams, getT()]);
  const category = await getCategoryByPath(path.join("/"));
  if (!category) notFound();
  const chain = await getCategoryBreadcrumb(category.id);
  const listing = parseListingParams(sp, "popular");
  const crumbs = [{ label: t("common.breadcrumb.home"), href: "/" }, ...chain.map((c, i) => ({ label: c.name, href: i === chain.length - 1 ? undefined : c.href }))];
  return (
    <Section className="py-6 md:py-10">
      <CatalogPageHeader
        crumbs={crumbs}
        breadcrumbLabel={t("common.breadcrumb.label")}
        title={category.seoTitle ?? category.name}
        description={category.description}
        subcategories={category.children}
        subcategoriesLabel={t("catalog.plp.subcategories")}
        countLabel={(n) => t.plural("catalog.plp.productsCount", n)}
      />
      <ProductListing scope={{ categoryId: category.id }} params={listing} basePath={category.href} listId={`category_${category.slug}`} defaultSort="popular" sortOptions={["popular", "price_asc", "price_desc", "newest", "promo", "bestsellers", "name_asc"]} emptyVariant={category.productCount === 0 ? "category" : "filters"} />
    </Section>
  );
}
