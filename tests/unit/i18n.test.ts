import { describe, it, expect } from "vitest";
import { createTranslator, getDictionary, interpolate } from "@/i18n";

describe("i18n", () => {
  it("interpole les variables", () => {
    expect(interpolate("Min. {count} {unit}", { count: 4, unit: "unités" })).toBe("Min. 4 unités");
    expect(interpolate("Bonjour {name}", {})).toBe("Bonjour {name}");
  });
  it("traduit et gère le pluriel", () => {
    const t = createTranslator("fr");
    expect(t("common.actions.addToCart")).toBe("Ajouter au panier");
    expect(t.plural("catalog.plp.productsCount", 1)).toBe("1 produit");
    expect(t.plural("catalog.plp.productsCount", 12)).toBe("12 produits");
    expect(t.enum("common.status.order", "SHIPPED")).toBe("Expédiée");
    expect(t.enum("common.status.order", "UNKNOWN")).toBe("UNKNOWN");
  });
  it("replie l'anglais et l'arabe sur le français", () => {
    const en = createTranslator("en");
    expect(en("common.actions.addToCart")).toBe("Add to cart");
    expect(en("cart.title")).toBe(getDictionary("fr").cart.title);
    const ar = createTranslator("ar");
    expect(ar.dir).toBe("rtl");
    expect(ar("common.actions.search")).toBe("بحث");
  });
});
