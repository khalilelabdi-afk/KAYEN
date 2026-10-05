import "server-only";
import { unstable_cache } from "next/cache";
import { db, Prisma } from "@/lib/db";
import type { PricingContext } from "@/lib/pricing/types";
import type { ProductCardData } from "@/types/catalog";
import { getProductsByIds } from "./products";
import { getCategoryTree, type CategoryNode } from "./categories";
import { getBrands } from "./brands";

/**
 * Recherche catalogue.
 * Implémentation PostgreSQL (plein texte français + trigrammes) derrière une interface
 * `SearchProvider`, remplaçable par Meilisearch / Algolia / Elasticsearch (SEARCH_PROVIDER).
 */
export interface SearchHit {
  id: string;
  score: number;
}

export interface SearchSuggestions {
  products: ProductCardData[];
  categories: { name: string; href: string; path: string }[];
  brands: { name: string; href: string }[];
  queries: string[];
  didYouMean: string | null;
}

export interface SearchProvider {
  searchProductIds(query: string, limit: number): Promise<SearchHit[]>;
  suggest(query: string, ctx: PricingContext): Promise<SearchSuggestions>;
  didYouMean(query: string): Promise<string | null>;
}

const getSynonyms = unstable_cache(
  async () => {
    const rows = await db.searchSynonym.findMany();
    const map = new Map<string, string[]>();
    for (const r of rows) {
      map.set(r.term.toLowerCase(), r.synonyms);
      for (const s of r.synonyms) map.set(s.toLowerCase(), [r.term, ...r.synonyms.filter((x) => x !== s)]);
    }
    return map;
  },
  ["search-synonyms"],
  { tags: ["search"], revalidate: 3600 },
);

export function normalizeQuery(q: string): string {
  return q.trim().replace(/\s+/g, " ").slice(0, 120);
}

/** Étend la requête avec les synonymes connus : "gobelet carton" → "gobelet OR verre jetable carton". */
async function expandQuery(q: string): Promise<string> {
  const synonyms = await getSynonyms();
  const words = q.toLowerCase().split(" ");
  const parts: string[] = [];
  for (const w of words) {
    const syn = synonyms.get(w);
    parts.push(syn && syn.length ? `(${[w, ...syn].map((s) => s.replace(/[^\p{L}\p{N}' -]/gu, "")).join(" OR ")})` : w);
  }
  return parts.join(" ");
}

const postgresProvider: SearchProvider = {
  async searchProductIds(query, limit) {
    const q = normalizeQuery(query);
    if (!q) return [];
    const expanded = await expandQuery(q);
    const like = `${q.toLowerCase()}%`;
    const rows = await db.$queryRaw<{ id: string; score: number }[]>(Prisma.sql`
      WITH q AS (
        SELECT websearch_to_tsquery('french', kayen_unaccent(${expanded})) AS tsq,
               kayen_unaccent(lower(${q})) AS raw
      )
      SELECT p.id,
        (CASE WHEN lower(p.sku) LIKE ${like} THEN 10 ELSE 0 END)
        + (CASE WHEN EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p.id AND lower(v.sku) LIKE ${like}) THEN 10 ELSE 0 END)
        + ts_rank_cd(kayen_product_search_vector(p.name, p.sku, p.keywords, p."shortDescription", p.description), q.tsq) * 6
        + similarity(kayen_unaccent(lower(p.name)), q.raw) * 4
        + (CASE WHEN kayen_unaccent(lower(p.name)) LIKE ('%' || q.raw || '%') THEN 2 ELSE 0 END)
        + LEAST(p."salesCount", 500) / 1000.0 AS score
      FROM "Product" p, q
      WHERE p.status = 'ACTIVE' AND (
        kayen_product_search_vector(p.name, p.sku, p.keywords, p."shortDescription", p.description) @@ q.tsq
        OR similarity(kayen_unaccent(lower(p.name)), q.raw) > 0.22
        OR kayen_unaccent(lower(p.name)) LIKE ('%' || q.raw || '%')
        OR lower(p.sku) LIKE ${like}
        OR EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p.id AND lower(v.sku) LIKE ${like})
      )
      ORDER BY score DESC
      LIMIT ${limit}
    `);
    return rows.map((r) => ({ id: r.id, score: Number(r.score) }));
  },

  async didYouMean(query) {
    const q = normalizeQuery(query).toLowerCase();
    if (q.length < 3) return null;
    const rows = await db.$queryRaw<{ word: string; sim: number }[]>(Prisma.sql`
      SELECT word, similarity(kayen_unaccent(lower(word)), kayen_unaccent(${q})) AS sim
      FROM (
        SELECT DISTINCT unnest(string_to_array(lower(name), ' ')) AS word FROM "Product" WHERE status = 'ACTIVE'
        UNION SELECT DISTINCT lower(name) FROM "Category" WHERE "isVisible" = true
        UNION SELECT DISTINCT lower(unnest(keywords)) FROM "Product" WHERE status = 'ACTIVE'
      ) words
      WHERE length(word) > 3 AND similarity(kayen_unaccent(lower(word)), kayen_unaccent(${q})) > 0.35
      ORDER BY sim DESC LIMIT 1
    `);
    const best = rows[0];
    return best && best.word !== q ? best.word : null;
  },

  async suggest(query, ctx) {
    const q = normalizeQuery(query);
    if (q.length < 2) return { products: [], categories: [], brands: [], queries: [], didYouMean: null };
    const [hits, tree, brands] = await Promise.all([this.searchProductIds(q, 6), getCategoryTree(), getBrands()]);
    const products = await getProductsByIds(hits.map((h) => h.id), ctx);
    const needle = q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const cats: CategoryNode[] = [];
    const walk = (nodes: CategoryNode[]) => {
      for (const n of nodes) {
        if (norm(n.name).includes(needle)) cats.push(n);
        walk(n.children);
      }
    };
    walk(tree);
    const categories = cats.slice(0, 4).map((c) => ({ name: c.name, href: c.href, path: c.path }));
    const brandHits = brands.filter((b) => norm(b.name).includes(needle)).slice(0, 3).map((b) => ({ name: b.name, href: b.href }));
    const queries = [...new Set(products.flatMap((p) => p.name.split(" ").slice(0, 2).join(" ")))].filter((s) => norm(s) !== needle).slice(0, 3);
    const didYouMean = products.length === 0 ? await this.didYouMean(q) : null;
    return { products, categories, brands: brandHits, queries, didYouMean };
  },
};

export function getSearchProvider(): SearchProvider {
  // Point d'extension : SEARCH_PROVIDER=meilisearch → implémenter un provider dédié ici.
  return postgresProvider;
}

/** Recherches populaires : catégories racines + mots-clés fréquents (sans tracking utilisateur). */
export const getPopularSearches = unstable_cache(
  async (): Promise<string[]> => {
    const products = await db.product.findMany({ where: { status: "ACTIVE" }, orderBy: { salesCount: "desc" }, take: 12, select: { keywords: true, name: true } });
    const terms = new Map<string, number>();
    for (const p of products) for (const k of p.keywords.slice(0, 2)) terms.set(k, (terms.get(k) ?? 0) + 1);
    return [...terms.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k);
  },
  ["popular-searches"],
  { tags: ["search", "products"], revalidate: 3600 },
);
