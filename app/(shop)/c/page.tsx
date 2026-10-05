import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getT } from "@/i18n/server";
import { getCategoryTree } from "@/services/catalog/categories";
import { parseListingParams, type RawSearchParams } from "@/lib/catalog/listing-params";
import { ProductListing } from "@/components/catalog/product-listing";
import { CatalogPageHeader } from "@/components/catalog/page-header";
import { Section } from "@/components/layout/section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("catalog.plp.allProductsTitle"), description: t("catalog.plp.allProductsDesc"), alternates: { canonical: "/c" } };
}

export default async function CatalogIndexPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const [t, sp, tree] = await Promise.all([getT(), searchParams, getCategoryTree()]);
  const params = parseListingParams(sp, "popular");
  return (
    <Section className="py-6 md:py-10">
      <CatalogPageHeader crumbs={[{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("catalog.plp.allProductsTitle") }]} breadcrumbLabel={t("common.breadcrumb.label")} title={t("catalog.plp.allProductsTitle")} description={t("catalog.plp.allProductsDesc")}>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tree.map((c) => (
            <li key={c.id}>
              <Link href={c.href} className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-2 transition-colors hover:border-ink">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-paper-2">
                  <Image src={c.image ?? `/images/categories/${c.slug}.svg`} alt="" fill sizes="48px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium group-hover:text-accent">{c.name}</span>
                  <span className="block text-xs text-muted">{t("home.categories.productsCount", { count: c.productCount })}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CatalogPageHeader>
      <ProductListing scope={{}} params={params} basePath="/c" listId="catalog_all" defaultSort="popular" sortOptions={["popular", "price_asc", "price_desc", "newest", "promo", "bestsellers", "name_asc"]} />
    </Section>
  );
}
