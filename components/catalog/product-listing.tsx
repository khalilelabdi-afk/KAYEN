import Link from "next/link";
import { SearchX } from "lucide-react";
import { getT } from "@/i18n/server";
import { getPricingContext } from "@/lib/auth/dal";
import { listProducts, type ListingScope } from "@/services/catalog/products";
import { listingParamsToSearch, type ListingParams } from "@/lib/catalog/listing-params";
import type { SortKey } from "@/types/catalog";
import { ProductGrid } from "@/components/commerce/product-grid";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { FilterSidebar, FilterDrawerButton, ActiveFilters } from "./filter-panel";
import { SortSelect } from "./sort-select";

const DEFAULT_SORTS: SortKey[] = ["relevance", "popular", "price_asc", "price_desc", "newest", "promo", "bestsellers"];

/** Listing complet : filtres (sidebar / drawer), tri, compteur, grille, pagination, état vide. */
export async function ProductListing({ scope, params, basePath, listId, defaultSort = "relevance", sortOptions = DEFAULT_SORTS, emptyVariant = "filters" }: { scope: ListingScope; params: ListingParams; basePath: string; listId: string; defaultSort?: SortKey; sortOptions?: SortKey[]; emptyVariant?: "filters" | "category" }) {
  const [t, ctx] = await Promise.all([getT(), getPricingContext()]);
  const result = await listProducts(scope, params, ctx);
  const hrefFor = (page: number) => `${basePath}${listingParamsToSearch({ ...params, page }, defaultSort)}`;
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.total, result.page * result.pageSize);

  return (
    <div className="flex gap-8">
      <FilterSidebar basePath={basePath} params={params} facets={result.facets} total={result.total} defaultSort={defaultSort} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <FilterDrawerButton basePath={basePath} params={params} facets={result.facets} total={result.total} defaultSort={defaultSort} />
            <p className="text-sm text-muted" aria-live="polite">
              <span className="font-semibold text-foreground tnum">{t.plural("catalog.plp.productsCount", result.total)}</span>
              {result.total > 0 && <span className="hidden sm:inline"> · {t("catalog.plp.showing", { from, to, total: result.total })}</span>}
            </p>
          </div>
          <SortSelect basePath={basePath} params={params} options={sortOptions} defaultSort={defaultSort} />
        </div>
        <div className="py-3 empty:hidden">
          <ActiveFilters basePath={basePath} params={params} facets={result.facets} defaultSort={defaultSort} />
        </div>
        {result.items.length ? (
          <>
            <ProductGrid products={result.items} listId={listId} columns={4} />
            <Pagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} labels={{ label: t("common.pagination.label"), previous: t("common.pagination.previous"), next: t("common.pagination.next"), goTo: t("common.pagination.goTo") }} className="mt-10" />
          </>
        ) : (
          <EmptyState
            icon={<SearchX />}
            title={emptyVariant === "category" ? t("catalog.plp.emptyCategory.title") : t("catalog.plp.empty.title")}
            description={emptyVariant === "category" ? t("catalog.plp.emptyCategory.desc") : t("catalog.plp.empty.desc")}
            className="mt-4"
            actions={
              <>
                <Button asChild variant="outline">
                  <Link href={`${basePath}${listingParamsToSearch({ q: params.q }, defaultSort)}`}>{t("catalog.plp.empty.reset")}</Link>
                </Button>
                <Button asChild>
                  <Link href="/c">{t("catalog.plp.empty.browse")}</Link>
                </Button>
              </>
            }
          />
        )}
      </div>
    </div>
  );
}
