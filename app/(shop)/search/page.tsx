import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getT } from "@/i18n/server";
import { getSearchProvider, normalizeQuery, getPopularSearches } from "@/services/catalog/search";
import { parseListingParams, type RawSearchParams } from "@/lib/catalog/listing-params";
import { ProductListing } from "@/components/catalog/product-listing";
import { Section } from "@/components/layout/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { getCategoryTree } from "@/services/catalog/categories";

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const t = await getT();
  const q = normalizeQuery(String((await searchParams).q ?? ""));
  return { title: q ? t("catalog.search.title", { query: q }) : t("catalog.search.titleEmpty"), robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  const [sp, t] = await Promise.all([searchParams, getT()]);
  const params = parseListingParams(sp, "relevance");
  const q = params.q ?? "";
  const crumbs = [{ label: t("common.breadcrumb.home"), href: "/" }, { label: q ? t("catalog.search.title", { query: q }) : t("catalog.search.titleEmpty") }];

  if (q.length < 2) {
    const popular = await getPopularSearches();
    return (
      <Section className="py-6 md:py-10">
        <Breadcrumb items={crumbs} label={t("common.breadcrumb.label")} className="mb-4" />
        <h1 className="t-h1">{t("catalog.search.titleEmpty")}</h1>
        <EmptyState icon={<Search />} title={t("catalog.search.typeToSearch")} description={t("catalog.search.minChars", { count: 2 })} className="mt-6" actions={popular.map((p) => (
          <Button key={p} asChild variant="outline" size="sm"><Link href={`/search?q=${encodeURIComponent(p)}`}>{p}</Link></Button>
        ))} />
      </Section>
    );
  }

  const provider = getSearchProvider();
  const hits = await provider.searchProductIds(q, 500);
  const ids = hits.map((h) => h.id);
  const didYouMean = ids.length === 0 ? await provider.didYouMean(q) : null;

  return (
    <Section className="py-6 md:py-10">
      <Breadcrumb items={crumbs} label={t("common.breadcrumb.label")} className="mb-4" />
      <div className="mb-6 md:mb-8">
        <h1 className="t-h1">{t("catalog.search.title", { query: q })}</h1>
        {didYouMean && (
          <p className="mt-2 text-sm text-muted">
            {t("catalog.search.didYouMean")}{" "}
            <Link href={`/search?q=${encodeURIComponent(didYouMean)}`} className="font-semibold text-foreground underline underline-offset-2">{didYouMean}</Link>
          </p>
        )}
      </div>
      {ids.length ? (
        <ProductListing scope={{ ids }} params={params} basePath="/search" listId="search" defaultSort="relevance" />
      ) : (
        <NoResults q={q} />
      )}
    </Section>
  );
}

async function NoResults({ q }: { q: string }) {
  const [t, tree] = await Promise.all([getT(), getCategoryTree()]);
  return (
    <EmptyState
      icon={<Search />}
      title={t("catalog.search.noResults", { query: q })}
      description={t("catalog.search.noResultsDesc")}
      size="lg"
      actions={tree.slice(0, 6).map((c) => (
        <Button key={c.id} asChild variant="outline" size="sm"><Link href={c.href}>{c.name}</Link></Button>
      ))}
    />
  );
}
