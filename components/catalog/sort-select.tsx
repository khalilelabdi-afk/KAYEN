"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/i18n/client";
import { Select } from "@/components/ui/input";
import { listingParamsToSearch, type ListingParams } from "@/lib/catalog/listing-params";
import type { SortKey } from "@/types/catalog";

export function SortSelect({ basePath, params, options, defaultSort = "relevance" }: { basePath: string; params: ListingParams; options: SortKey[]; defaultSort?: SortKey }) {
  const t = useT();
  const router = useRouter();
  const labels: Record<SortKey, string> = {
    relevance: t("catalog.plp.sort.relevance"),
    popular: t("catalog.plp.sort.popular"),
    price_asc: t("catalog.plp.sort.priceAsc"),
    price_desc: t("catalog.plp.sort.priceDesc"),
    newest: t("catalog.plp.sort.newest"),
    promo: t("catalog.plp.sort.promo"),
    bestsellers: t("catalog.plp.sort.bestsellers"),
    name_asc: t("catalog.plp.sort.nameAsc"),
  };
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted sm:inline">{t("catalog.plp.sortBy")}</span>
      <Select
        value={params.sort}
        onChange={(e) => router.push(`${basePath}${listingParamsToSearch({ ...params, sort: e.target.value as SortKey, page: 1 }, defaultSort)}`, { scroll: false })}
        className="h-9 w-44 text-sm"
        aria-label={t("catalog.plp.sortBy")}
      >
        {options.map((o) => (
          <option key={o} value={o}>{labels[o]}</option>
        ))}
      </Select>
    </label>
  );
}
