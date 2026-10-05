"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, SlidersHorizontal } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import type { ListingFacets } from "@/types/catalog";
import { listingParamsToSearch, countActiveFilters, type ListingParams } from "@/lib/catalog/listing-params";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface FilterPanelProps {
  basePath: string;
  params: ListingParams;
  facets: ListingFacets;
  total: number;
  defaultSort?: ListingParams["sort"];
}

function useFilterNav(basePath: string, params: ListingParams, defaultSort: ListingParams["sort"]) {
  const router = useRouter();
  const hrefFor = (next: Partial<ListingParams>) => `${basePath}${listingParamsToSearch({ ...params, ...next, page: 1 }, defaultSort)}`;
  const go = (next: Partial<ListingParams>) => router.push(hrefFor(next), { scroll: false });
  const toggle = (key: "brands" | "packagings" | "units", value: string) => {
    const list = params[key];
    go({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] });
  };
  const toggleAttr = (code: string, value: string) => {
    const list = params.attrs[code] ?? [];
    const nextList = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    const attrs = { ...params.attrs };
    if (nextList.length) attrs[code] = nextList;
    else delete attrs[code];
    go({ attrs });
  };
  return { hrefFor, go, toggle, toggleAttr };
}

function FacetList({ values, selected, onToggle, searchable, searchPlaceholder, idPrefix }: { values: { value: string; label: string; count: number }[]; selected: string[]; onToggle: (v: string) => void; searchable?: boolean; searchPlaceholder?: string; idPrefix: string }) {
  const [q, setQ] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);
  const t = useT();
  const filtered = q ? values.filter((v) => v.label.toLowerCase().includes(q.toLowerCase())) : values;
  const visible = showAll ? filtered : filtered.slice(0, 8);
  return (
    <div className="space-y-2">
      {searchable && values.length > 8 && <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} className="h-8 text-xs" />}
      <ul className="space-y-1.5">
        {visible.map((v) => {
          const id = `${idPrefix}-${v.value}`.replace(/[^a-zA-Z0-9_-]/g, "_");
          const checked = selected.includes(v.value);
          return (
            <li key={v.value} className="flex items-center gap-2.5">
              <Checkbox id={id} checked={checked} onCheckedChange={() => onToggle(v.value)} />
              <label htmlFor={id} className={cn("flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 text-sm", checked && "font-medium")}>
                <span className="truncate">{v.label}</span>
                <span className="text-xs text-subtle tnum">{v.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {filtered.length > 8 && (
        <button type="button" onClick={() => setShowAll((s) => !s)} className="text-xs font-medium text-muted hover:text-foreground">
          {showAll ? t("common.actions.showLess") : `${t("common.actions.seeMore")} (${filtered.length - 8})`}
        </button>
      )}
    </div>
  );
}

function PriceFilter({ params, facets, go }: { params: ListingParams; facets: ListingFacets; go: (n: Partial<ListingParams>) => void }) {
  const t = useT();
  const [min, setMin] = React.useState(params.priceMin !== null ? (params.priceMin / 100).toString() : "");
  const [max, setMax] = React.useState(params.priceMax !== null ? (params.priceMax / 100).toString() : "");
  const [lastRange, setLastRange] = React.useState(`${params.priceMin}-${params.priceMax}`);
  if (`${params.priceMin}-${params.priceMax}` !== lastRange) {
    setLastRange(`${params.priceMin}-${params.priceMax}`);
    setMin(params.priceMin !== null ? (params.priceMin / 100).toString() : "");
    setMax(params.priceMax !== null ? (params.priceMax / 100).toString() : "");
  }
  const apply = () => {
    const toMinor = (v: string) => {
      const n = Number.parseFloat(v.replace(",", "."));
      return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
    };
    go({ priceMin: toMinor(min), priceMax: toMinor(max) });
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="space-y-2"
    >
      {facets.priceRange && (
        <p className="text-xs text-muted tnum">
          {formatMoney(facets.priceRange.min)} – {formatMoney(facets.priceRange.max)}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Input type="number" inputMode="decimal" min={0} step="0.01" value={min} onChange={(e) => setMin(e.target.value)} placeholder={t("catalog.plp.filter.priceMin")} aria-label={t("catalog.plp.filter.priceMin")} className="h-9 text-sm" />
        <span className="text-muted">–</span>
        <Input type="number" inputMode="decimal" min={0} step="0.01" value={max} onChange={(e) => setMax(e.target.value)} placeholder={t("catalog.plp.filter.priceMax")} aria-label={t("catalog.plp.filter.priceMax")} className="h-9 text-sm" />
        <Button type="submit" size="sm" variant="secondary">{t("common.actions.apply")}</Button>
      </div>
    </form>
  );
}

function FilterGroups({ basePath, params, facets, defaultSort = "relevance" }: FilterPanelProps) {
  const t = useT();
  const { go, toggle, toggleAttr } = useFilterNav(basePath, params, defaultSort);
  const groups: { key: string; title: string; content: React.ReactNode }[] = [];

  groups.push({
    key: "availability",
    title: t("catalog.plp.filter.availability"),
    content: (
      <ul className="space-y-1.5">
        <li className="flex items-center gap-2.5">
          <Checkbox id="f-stock" checked={params.inStock} onCheckedChange={() => go({ inStock: !params.inStock })} />
          <label htmlFor="f-stock" className="flex flex-1 cursor-pointer items-center justify-between text-sm"><span>{t("catalog.plp.filter.inStockOnly")}</span><span className="text-xs text-subtle tnum">{facets.inStockCount}</span></label>
        </li>
        {(facets.promoCount > 0 || params.promo) && (
          <li className="flex items-center gap-2.5">
            <Checkbox id="f-promo" checked={params.promo} onCheckedChange={() => go({ promo: !params.promo })} />
            <label htmlFor="f-promo" className="flex flex-1 cursor-pointer items-center justify-between text-sm"><span>{t("catalog.plp.filter.promoOnly")}</span><span className="text-xs text-subtle tnum">{facets.promoCount}</span></label>
          </li>
        )}
        {(facets.newCount > 0 || params.isNew) && (
          <li className="flex items-center gap-2.5">
            <Checkbox id="f-new" checked={params.isNew} onCheckedChange={() => go({ isNew: !params.isNew })} />
            <label htmlFor="f-new" className="flex flex-1 cursor-pointer items-center justify-between text-sm"><span>{t("catalog.plp.filter.newOnly")}</span><span className="text-xs text-subtle tnum">{facets.newCount}</span></label>
          </li>
        )}
      </ul>
    ),
  });
  if (facets.brands.length > 1 || params.brands.length) {
    groups.push({ key: "brand", title: t("catalog.plp.filter.brand"), content: <FacetList idPrefix="brand" values={facets.brands} selected={params.brands} onToggle={(v) => toggle("brands", v)} searchable searchPlaceholder={t("catalog.plp.filter.searchBrand")} /> });
  }
  groups.push({ key: "price", title: t("catalog.plp.filter.price"), content: <PriceFilter params={params} facets={facets} go={go} /> });
  if (facets.packagings.length > 1 || params.packagings.length) {
    groups.push({ key: "pack", title: t("catalog.plp.filter.packaging"), content: <FacetList idPrefix="pack" values={facets.packagings} selected={params.packagings} onToggle={(v) => toggle("packagings", v)} /> });
  }
  if (facets.units.length > 1 || params.units.length) {
    groups.push({ key: "unit", title: t("catalog.plp.filter.unit"), content: <FacetList idPrefix="unit" values={facets.units} selected={params.units} onToggle={(v) => toggle("units", v)} /> });
  }
  groups.push({
    key: "moq",
    title: t("catalog.plp.filter.moq"),
    content: (
      <ul className="space-y-1.5">
        {[1, 6, 12, 24].map((m) => (
          <li key={m} className="flex items-center gap-2.5">
            <Checkbox id={`f-moq-${m}`} checked={params.moqMax === m} onCheckedChange={() => go({ moqMax: params.moqMax === m ? null : m })} />
            <label htmlFor={`f-moq-${m}`} className="cursor-pointer text-sm">{t("catalog.plp.filter.moqUpTo", { count: m })}</label>
          </li>
        ))}
      </ul>
    ),
  });
  for (const attr of facets.attributes) {
    groups.push({ key: `a_${attr.code}`, title: attr.name, content: <FacetList idPrefix={`a-${attr.code}`} values={attr.values} selected={params.attrs[attr.code] ?? []} onToggle={(v) => toggleAttr(attr.code, v)} /> });
  }

  const openByDefault = groups.slice(0, 4).map((g) => g.key).concat(Object.keys(params.attrs).map((c) => `a_${c}`));
  return (
    <Accordion type="multiple" defaultValue={openByDefault}>
      {groups.map((g) => (
        <AccordionItem key={g.key} value={g.key}>
          <AccordionTrigger className="py-3 text-[13px] font-semibold">{g.title}</AccordionTrigger>
          <AccordionContent className="text-foreground">{g.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/** Puces de filtres actifs + réinitialisation. */
export function ActiveFilters({ basePath, params, facets, defaultSort = "relevance" }: Omit<FilterPanelProps, "total">) {
  const t = useT();
  const { hrefFor } = useFilterNav(basePath, params, defaultSort);
  const count = countActiveFilters(params);
  if (!count) return null;
  const chips: { label: string; href: string }[] = [];
  for (const b of params.brands) chips.push({ label: facets.brands.find((f) => f.value === b)?.label ?? b, href: hrefFor({ brands: params.brands.filter((x) => x !== b) }) });
  if (params.priceMin !== null || params.priceMax !== null) chips.push({ label: `${params.priceMin !== null ? formatMoney(params.priceMin) : "…"} – ${params.priceMax !== null ? formatMoney(params.priceMax) : "…"}`, href: hrefFor({ priceMin: null, priceMax: null }) });
  if (params.inStock) chips.push({ label: t("catalog.plp.filter.inStockOnly"), href: hrefFor({ inStock: false }) });
  if (params.promo) chips.push({ label: t("catalog.plp.filter.promoOnly"), href: hrefFor({ promo: false }) });
  if (params.isNew) chips.push({ label: t("catalog.plp.filter.newOnly"), href: hrefFor({ isNew: false }) });
  if (params.moqMax) chips.push({ label: t("catalog.plp.filter.moqUpTo", { count: params.moqMax }), href: hrefFor({ moqMax: null }) });
  for (const p of params.packagings) chips.push({ label: p, href: hrefFor({ packagings: params.packagings.filter((x) => x !== p) }) });
  for (const u of params.units) chips.push({ label: u, href: hrefFor({ units: params.units.filter((x) => x !== u) }) });
  for (const [code, values] of Object.entries(params.attrs)) {
    const def = facets.attributes.find((a) => a.code === code);
    for (const v of values) {
      const attrs = { ...params.attrs, [code]: values.filter((x) => x !== v) };
      if (!attrs[code].length) delete attrs[code];
      chips.push({ label: `${def?.name ?? code} : ${def?.values.find((x) => x.value === v)?.label ?? v}`, href: hrefFor({ attrs }) });
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Link key={c.label + c.href} href={c.href} scroll={false} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface py-1 pe-2 ps-2.5 text-xs font-medium hover:border-ink">
          {c.label}
          <X className="size-3" aria-hidden />
        </Link>
      ))}
      <Link href={`${basePath}${listingParamsToSearch({ q: params.q, sort: params.sort }, defaultSort)}`} scroll={false} className="text-xs font-semibold text-muted underline underline-offset-2 hover:text-foreground">
        {t("catalog.plp.resetFilters")}
      </Link>
    </div>
  );
}

/** Sidebar desktop. */
export function FilterSidebar(props: FilterPanelProps) {
  const t = useT();
  return (
    <aside className="hidden w-64 shrink-0 lg:block" aria-label={t("catalog.plp.filters")}>
      <div className="sticky top-32">
        <p className="t-label mb-1 text-muted">{t("catalog.plp.filters")}</p>
        <FilterGroups {...props} />
      </div>
    </aside>
  );
}

/** Bouton + drawer mobile. */
export function FilterDrawerButton(props: FilterPanelProps) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const count = countActiveFilters(props.params);
  return (
    <>
      <Button variant="outline" size="md" className="lg:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal />
        {t("catalog.plp.showFilters")}
        {count > 0 && <span className="ms-1 inline-flex size-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">{count}</span>}
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent side="left" width="max-w-sm">
          <DrawerHeader>
            <DrawerTitle className="t-h4">{t("catalog.plp.filters")}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <DrawerDescription className="sr-only">{t("catalog.plp.filters")}</DrawerDescription>
            <FilterGroups {...props} />
          </DrawerBody>
          <DrawerFooter className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href={`${props.basePath}${listingParamsToSearch({ q: props.params.q, sort: props.params.sort }, props.defaultSort)}`} scroll={false} onClick={() => setOpen(false)}>{t("common.actions.reset")}</Link>
            </Button>
            <Button className="flex-1" onClick={() => setOpen(false)}>{t("catalog.plp.applyFilters", { count: props.total })}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
