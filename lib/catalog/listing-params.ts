import type { SortKey } from "@/types/catalog";

/**
 * Paramètres d'un listing (catégorie, recherche, marque, promotions…) :
 * lecture depuis l'URL et reconstruction d'URL pour les filtres (partagé client/serveur).
 */
export interface ListingParams {
  page: number;
  sort: SortKey;
  brands: string[];
  priceMin: number | null; // centimes
  priceMax: number | null;
  inStock: boolean;
  promo: boolean;
  isNew: boolean;
  moqMax: number | null;
  packagings: string[];
  units: string[];
  attrs: Record<string, string[]>;
  q: string | null;
}

export const SORT_KEYS: SortKey[] = ["relevance", "popular", "price_asc", "price_desc", "newest", "promo", "bestsellers", "name_asc"];

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function list(v: string | string[] | undefined): string[] {
  const raw = Array.isArray(v) ? v.join(",") : (v ?? "");
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
}
function euroToMinor(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number.parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export function parseListingParams(sp: RawSearchParams, defaultSort: SortKey = "relevance"): ListingParams {
  const sortRaw = first(sp.sort);
  const page = Math.max(1, Number.parseInt(first(sp.page) ?? "1", 10) || 1);
  const attrs: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (key.startsWith("a_") && key.length > 2) {
      const values = list(value);
      if (values.length) attrs[key.slice(2)] = values;
    }
  }
  const moq = Number.parseInt(first(sp.moq) ?? "", 10);
  return {
    page,
    sort: SORT_KEYS.includes(sortRaw as SortKey) ? (sortRaw as SortKey) : defaultSort,
    brands: list(sp.brand),
    priceMin: euroToMinor(first(sp.price_min)),
    priceMax: euroToMinor(first(sp.price_max)),
    inStock: first(sp.stock) === "1",
    promo: first(sp.promo) === "1",
    isNew: first(sp.new) === "1",
    moqMax: Number.isFinite(moq) && moq > 0 ? moq : null,
    packagings: list(sp.pack),
    units: list(sp.unit),
    attrs,
    q: first(sp.q)?.trim().slice(0, 120) || null,
  };
}

/** Sérialise les paramètres en query string (sans valeurs par défaut). */
export function listingParamsToSearch(p: Partial<ListingParams>, defaultSort: SortKey = "relevance"): string {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.sort && p.sort !== defaultSort) sp.set("sort", p.sort);
  if (p.brands?.length) sp.set("brand", p.brands.join(","));
  if (p.priceMin !== null && p.priceMin !== undefined) sp.set("price_min", (p.priceMin / 100).toString());
  if (p.priceMax !== null && p.priceMax !== undefined) sp.set("price_max", (p.priceMax / 100).toString());
  if (p.inStock) sp.set("stock", "1");
  if (p.promo) sp.set("promo", "1");
  if (p.isNew) sp.set("new", "1");
  if (p.moqMax) sp.set("moq", String(p.moqMax));
  if (p.packagings?.length) sp.set("pack", p.packagings.join(","));
  if (p.units?.length) sp.set("unit", p.units.join(","));
  for (const [code, values] of Object.entries(p.attrs ?? {})) if (values.length) sp.set(`a_${code}`, values.join(","));
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function countActiveFilters(p: ListingParams): number {
  return (
    p.brands.length +
    (p.priceMin !== null || p.priceMax !== null ? 1 : 0) +
    (p.inStock ? 1 : 0) +
    (p.promo ? 1 : 0) +
    (p.isNew ? 1 : 0) +
    (p.moqMax ? 1 : 0) +
    p.packagings.length +
    p.units.length +
    Object.values(p.attrs).reduce((s, v) => s + v.length, 0)
  );
}

export function emptyListingParams(q: string | null = null, sort: SortKey = "relevance"): ListingParams {
  return { page: 1, sort, brands: [], priceMin: null, priceMax: null, inStock: false, promo: false, isNew: false, moqMax: null, packagings: [], units: [], attrs: {}, q };
}
