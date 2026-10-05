import { NextResponse, type NextRequest } from "next/server";
import { getSearchProvider, normalizeQuery, getPopularSearches } from "@/services/catalog/search";
import { getPricingContext } from "@/lib/auth/dal";

export async function GET(request: NextRequest) {
  const q = normalizeQuery(request.nextUrl.searchParams.get("q") ?? "");
  const ctx = await getPricingContext();
  if (q.length < 2) {
    const popular = await getPopularSearches();
    return NextResponse.json({ products: [], categories: [], brands: [], queries: popular, didYouMean: null }, { headers: { "Cache-Control": "private, max-age=60" } });
  }
  const suggestions = await getSearchProvider().suggest(q, ctx);
  return NextResponse.json(suggestions, { headers: { "Cache-Control": "private, max-age=30" } });
}
