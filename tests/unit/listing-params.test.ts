import { describe, it, expect } from "vitest";
import { parseListingParams, listingParamsToSearch, countActiveFilters, emptyListingParams } from "@/lib/catalog/listing-params";

describe("listing params", () => {
  it("parse les paramètres d'URL", () => {
    const p = parseListingParams({ brand: "nordvik,tessera", price_min: "12,5", price_max: "40", stock: "1", promo: "1", sort: "price_asc", page: "3", a_material: "inox,verre", moq: "12", q: "  gobelet " });
    expect(p.brands).toEqual(["nordvik", "tessera"]);
    expect(p.priceMin).toBe(1250);
    expect(p.priceMax).toBe(4000);
    expect(p.inStock).toBe(true);
    expect(p.promo).toBe(true);
    expect(p.sort).toBe("price_asc");
    expect(p.page).toBe(3);
    expect(p.attrs).toEqual({ material: ["inox", "verre"] });
    expect(p.moqMax).toBe(12);
    expect(p.q).toBe("gobelet");
  });
  it("ignore les valeurs invalides", () => {
    const p = parseListingParams({ sort: "hack", page: "-2", price_min: "abc", moq: "0" });
    expect(p.sort).toBe("relevance");
    expect(p.page).toBe(1);
    expect(p.priceMin).toBeNull();
    expect(p.moqMax).toBeNull();
  });
  it("sérialise sans les valeurs par défaut", () => {
    const p = { ...emptyListingParams(), brands: ["a"], priceMin: 1250, page: 2, attrs: { color: ["bleu"] } };
    expect(listingParamsToSearch(p)).toBe("?brand=a&price_min=12.5&a_color=bleu&page=2");
    expect(listingParamsToSearch(emptyListingParams())).toBe("");
  });
  it("compte les filtres actifs", () => {
    expect(countActiveFilters(emptyListingParams())).toBe(0);
    expect(countActiveFilters({ ...emptyListingParams(), brands: ["a", "b"], inStock: true, attrs: { x: ["1"] } })).toBe(4);
  });
});
