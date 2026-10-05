import { describe, it, expect } from "vitest";
import {
  calculateUnitPrice,
  calculateLine,
  calculateCartTotals,
  buildTierTable,
  normalizeQuantity,
  stepQuantity,
  findActiveTier,
  findNextTier,
  allocateProportionally,
  type VariantPricingInput,
  type PricingContext,
  type PricingPromotion,
} from "@/lib/pricing";

const now = new Date("2026-06-01T10:00:00Z");

const guest: PricingContext = { isAuthenticated: false, businessId: null, customerGroupId: null, groupDiscountBps: 0, now };
const pro: PricingContext = { isAuthenticated: true, businessId: "biz_1", customerGroupId: "grp_pro", groupDiscountBps: 0, now };

function variant(overrides: Partial<VariantPricingInput> = {}): VariantPricingInput {
  return {
    variantId: "var_1",
    productId: "prod_1",
    categoryIds: ["cat_hygiene", "cat_nettoyage"],
    brandId: "brand_1",
    basePrice: 1290,
    compareAtPrice: null,
    moq: 1,
    orderMultiple: 1,
    quoteOnlyAbove: 100,
    tiers: [
      { minQuantity: 6, maxQuantity: 23, unitPrice: 1190 },
      { minQuantity: 24, maxQuantity: 99, unitPrice: 1070 },
    ],
    customerPrices: [],
    taxRateBps: 2000,
    requiresAccount: false,
    ...overrides,
  };
}

function promo(overrides: Partial<PricingPromotion> = {}): PricingPromotion {
  return {
    id: "promo_1",
    name: "Promo",
    type: "PERCENTAGE",
    scope: "PRODUCT",
    valueBps: 1000,
    valueAmount: null,
    specialPrice: null,
    minQuantity: null,
    minOrderAmount: null,
    priority: 0,
    isAutomatic: true,
    showBadge: true,
    badgeLabel: null,
    startsAt: null,
    endsAt: null,
    customerGroupId: null,
    productIds: ["prod_1"],
    categoryIds: [],
    brandIds: [],
    ...overrides,
  };
}

describe("normalizeQuantity", () => {
  it("applique le MOQ", () => {
    expect(normalizeQuantity(1, 4, 1)).toBe(4);
    expect(normalizeQuantity(0, 4, 1)).toBe(4);
    expect(normalizeQuantity(-3, 4, 1)).toBe(4);
  });
  it("arrondit au pas supérieur à partir du MOQ", () => {
    expect(normalizeQuantity(5, 4, 4)).toBe(8);
    expect(normalizeQuantity(8, 4, 4)).toBe(8);
    expect(normalizeQuantity(13, 12, 6)).toBe(18);
  });
  it("gère les valeurs invalides", () => {
    expect(normalizeQuantity(Number.NaN, 2, 1)).toBe(2);
    expect(normalizeQuantity(3.7, 1, 1)).toBe(3);
  });
  it("stepQuantity respecte MOQ et pas", () => {
    expect(stepQuantity(4, 1, 4, 4)).toBe(8);
    expect(stepQuantity(8, -1, 4, 4)).toBe(4);
    expect(stepQuantity(4, -1, 4, 4)).toBe(4);
  });
});

describe("paliers", () => {
  const tiers = variant().tiers;
  it("trouve le palier actif", () => {
    expect(findActiveTier(tiers, 3)).toBeNull();
    expect(findActiveTier(tiers, 6)?.unitPrice).toBe(1190);
    expect(findActiveTier(tiers, 23)?.unitPrice).toBe(1190);
    expect(findActiveTier(tiers, 24)?.unitPrice).toBe(1070);
    expect(findActiveTier(tiers, 500)?.unitPrice).toBe(1070);
  });
  it("annonce le prochain palier", () => {
    const next = findNextTier(tiers, 3, 1290);
    expect(next?.quantityToAdd).toBe(3);
    expect(next?.savingsPercent).toBe(8);
    expect(findNextTier(tiers, 50, 1070)).toBeNull();
  });
});

describe("calculateUnitPrice", () => {
  it("prix de base sous le premier palier", () => {
    const r = calculateUnitPrice(variant(), 3, guest);
    expect(r.unitPrice).toBe(1290);
    expect(r.source).toBe("base");
    expect(r.nextTier?.quantityToAdd).toBe(3);
    expect(r.requiresQuote).toBe(false);
  });
  it("prix palier", () => {
    const r = calculateUnitPrice(variant(), 24, guest);
    expect(r.unitPrice).toBe(1070);
    expect(r.source).toBe("tier");
    expect(r.savingsPercent).toBe(17);
    expect(r.activeTier?.minQuantity).toBe(24);
  });
  it("devis requis au-delà du seuil", () => {
    const r = calculateUnitPrice(variant(), 100, guest);
    expect(r.requiresQuote).toBe(true);
  });
  it("prix masqué si compte requis et invité", () => {
    const r = calculateUnitPrice(variant({ requiresAccount: true }), 10, guest);
    expect(r.hidden).toBe(true);
    const r2 = calculateUnitPrice(variant({ requiresAccount: true }), 10, pro);
    expect(r2.hidden).toBe(false);
    expect(r2.unitPrice).toBe(1190);
  });
  it("prix contractuel entreprise prioritaire sur tout", () => {
    const v = variant({
      customerPrices: [
        { businessId: "biz_1", customerGroupId: null, minQuantity: 1, unitPrice: 999, startsAt: null, endsAt: null },
        { businessId: "biz_1", customerGroupId: null, minQuantity: 50, unitPrice: 899, startsAt: null, endsAt: null },
      ],
    });
    const r = calculateUnitPrice(v, 10, pro, [promo({ valueBps: 5000 })]);
    expect(r.unitPrice).toBe(999);
    expect(r.source).toBe("contract");
    expect(r.promotion).toBeNull();
    expect(r.nextTier?.tier.unitPrice).toBe(899);
    expect(calculateUnitPrice(v, 60, pro).unitPrice).toBe(899);
  });
  it("prix de groupe explicite", () => {
    const v = variant({
      customerPrices: [{ businessId: null, customerGroupId: "grp_pro", minQuantity: 1, unitPrice: 1100, startsAt: null, endsAt: null }],
    });
    expect(calculateUnitPrice(v, 1, pro).source).toBe("group");
    expect(calculateUnitPrice(v, 1, pro).unitPrice).toBe(1100);
    expect(calculateUnitPrice(v, 1, guest).unitPrice).toBe(1290);
  });
  it("prix contractuel expiré ignoré", () => {
    const v = variant({
      customerPrices: [{ businessId: "biz_1", customerGroupId: null, minQuantity: 1, unitPrice: 500, startsAt: null, endsAt: new Date("2026-01-01") }],
    });
    expect(calculateUnitPrice(v, 1, pro).unitPrice).toBe(1290);
  });
  it("remise de groupe sur le prix public", () => {
    const ctx = { ...pro, groupDiscountBps: 500 };
    const r = calculateUnitPrice(variant(), 6, ctx);
    expect(r.unitPrice).toBe(1130); // remise 59,5 → 60 centimes (arrondi)
    expect(r.source).toBe("group_discount");
  });
  it("promotion produit : meilleure que la remise de groupe → appliquée, jamais cumulée", () => {
    const ctx = { ...pro, groupDiscountBps: 500 };
    const r = calculateUnitPrice(variant(), 1, ctx, [promo({ valueBps: 1000 })]);
    expect(r.unitPrice).toBe(1161); // 1290 - 10 %
    expect(r.source).toBe("promotion");
    expect(r.compareAtUnitPrice).toBe(1290);
    expect(r.promotion?.id).toBe("promo_1");
  });
  it("promotion inférieure à la remise de groupe → remise de groupe", () => {
    const ctx = { ...pro, groupDiscountBps: 1500 };
    const r = calculateUnitPrice(variant(), 1, ctx, [promo({ valueBps: 1000 })]);
    expect(r.source).toBe("group_discount");
  });
  it("promotion catégorie et marque", () => {
    const cat = calculateUnitPrice(variant(), 1, guest, [promo({ scope: "CATEGORY", productIds: [], categoryIds: ["cat_hygiene"] })]);
    expect(cat.unitPrice).toBe(1161);
    const brand = calculateUnitPrice(variant(), 1, guest, [promo({ scope: "BRAND", productIds: [], brandIds: ["brand_1"] })]);
    expect(brand.unitPrice).toBe(1161);
    const other = calculateUnitPrice(variant(), 1, guest, [promo({ scope: "BRAND", productIds: [], brandIds: ["brand_x"] })]);
    expect(other.unitPrice).toBe(1290);
  });
  it("promotion expirée ou future ignorée", () => {
    expect(calculateUnitPrice(variant(), 1, guest, [promo({ endsAt: new Date("2026-05-01") })]).unitPrice).toBe(1290);
    expect(calculateUnitPrice(variant(), 1, guest, [promo({ startsAt: new Date("2026-07-01") })]).unitPrice).toBe(1290);
  });
  it("prix spécial et montant fixe", () => {
    expect(calculateUnitPrice(variant(), 1, guest, [promo({ type: "SPECIAL_PRICE", specialPrice: 990 })]).unitPrice).toBe(990);
    expect(calculateUnitPrice(variant(), 1, guest, [promo({ type: "FIXED_AMOUNT", valueAmount: 200 })]).unitPrice).toBe(1090);
    // un prix spécial supérieur au prix courant ne s'applique pas
    expect(calculateUnitPrice(variant(), 24, guest, [promo({ type: "SPECIAL_PRICE", specialPrice: 1100 })]).unitPrice).toBe(1070);
  });
  it("promotion quantité avec minimum", () => {
    const p = promo({ type: "QUANTITY", minQuantity: 10, valueBps: 2000 });
    expect(calculateUnitPrice(variant(), 5, guest, [p]).unitPrice).toBe(1290);
    expect(calculateUnitPrice(variant(), 10, guest, [p]).unitPrice).toBe(952); // 1190 - 20 %
  });
  it("choisit la meilleure promotion", () => {
    const r = calculateUnitPrice(variant(), 1, guest, [promo({ id: "a", valueBps: 500 }), promo({ id: "b", valueBps: 1500 })]);
    expect(r.promotion?.id).toBe("b");
  });
  it("ne tient pas compte des promotions à code (coupons) au niveau produit", () => {
    expect(calculateUnitPrice(variant(), 1, guest, [promo({ isAutomatic: false })]).unitPrice).toBe(1290);
  });
});

describe("buildTierTable", () => {
  it("construit un tableau lisible avec palier actif et ligne devis", () => {
    const rows = buildTierTable(variant(), 10, guest);
    expect(rows.map((r) => [r.minQuantity, r.maxQuantity, r.unitPrice, r.savingsPercent, r.isActive, r.requiresQuote])).toEqual([
      [1, 5, 1290, 0, false, false],
      [6, 23, 1190, 8, true, false],
      [24, 99, 1070, 17, false, false],
      [100, null, 0, 0, false, true],
    ]);
  });
  it("sans paliers ni devis : une seule ligne", () => {
    const rows = buildTierTable(variant({ tiers: [], quoteOnlyAbove: null, moq: 4 }), 4, guest);
    expect(rows).toHaveLength(1);
    expect(rows[0].minQuantity).toBe(4);
    expect(rows[0].isActive).toBe(true);
  });
  it("tableau contractuel pour un client sous contrat", () => {
    const v = variant({
      customerPrices: [
        { businessId: "biz_1", customerGroupId: null, minQuantity: 1, unitPrice: 999, startsAt: null, endsAt: null },
        { businessId: "biz_1", customerGroupId: null, minQuantity: 50, unitPrice: 899, startsAt: null, endsAt: null },
      ],
    });
    const rows = buildTierTable(v, 1, pro);
    expect(rows[0].unitPrice).toBe(999);
    expect(rows[1].unitPrice).toBe(899);
    expect(rows[1].savingsPercent).toBe(10);
  });
});

describe("calculateLine & calculateCartTotals", () => {
  const line = (qty: number, over: Partial<VariantPricingInput> = {}, id = "var_1") =>
    calculateLine({ variantId: id, productId: over.productId ?? "prod_1", quantity: qty, pricing: variant({ variantId: id, ...over }) }, guest);

  it("ligne : sous-total, économies", () => {
    const l = line(24);
    expect(l.lineSubtotal).toBe(24 * 1070);
    expect(l.baseSubtotal).toBe(24 * 1290);
    expect(l.savings).toBe(24 * 220);
  });

  it("répartition proportionnelle exacte", () => {
    const parts = allocateProportionally(100, [333, 333, 334]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100);
    expect(allocateProportionally(0, [1, 2])).toEqual([0, 0]);
    expect(allocateProportionally(10, [0, 0])).toEqual([0, 0]);
  });

  it("totaux : TVA, livraison payante", () => {
    const totals = calculateCartTotals({
      lines: [line(2)],
      orderPromotions: [],
      coupon: null,
      shipping: { code: "std", name: "Standard", price: 990, freeAbove: null },
      shippingTaxRateBps: 2000,
      freeShippingThreshold: 30000,
    });
    expect(totals.subtotal).toBe(2580);
    expect(totals.shippingTotal).toBe(990);
    expect(totals.shippingIsFree).toBe(false);
    expect(totals.freeShippingRemaining).toBe(30000 - 2580);
    expect(totals.taxTotal).toBe(516 + 198);
    expect(totals.total).toBe(2580 + 990 + 714);
    expect(totals.itemCount).toBe(2);
  });

  it("franco atteint → livraison offerte", () => {
    const totals = calculateCartTotals({
      lines: [line(30)],
      orderPromotions: [],
      coupon: null,
      shipping: { code: "std", name: "Standard", price: 990, freeAbove: null },
      shippingTaxRateBps: 2000,
      freeShippingThreshold: 30000,
    });
    expect(totals.subtotal).toBe(30 * 1070);
    expect(totals.shippingIsFree).toBe(true);
    expect(totals.shippingTotal).toBe(0);
    expect(totals.freeShippingRemaining).toBe(0);
  });

  it("promotion commande automatique + coupon cumulés, TVA sur le net", () => {
    const auto = promo({ id: "auto", scope: "ORDER", type: "PERCENTAGE", valueBps: 1000, minOrderAmount: 2000, productIds: [] });
    const coupon = promo({ id: "coupon", scope: "ORDER", type: "FIXED_AMOUNT", valueAmount: 500, isAutomatic: false, productIds: [] });
    const totals = calculateCartTotals({
      lines: [line(2), line(2, { productId: "prod_2", taxRateBps: 550 }, "var_2")],
      orderPromotions: [auto],
      coupon: { code: "BIENVENUE", promotion: coupon },
      shipping: null,
      shippingTaxRateBps: 2000,
      freeShippingThreshold: null,
    });
    expect(totals.subtotal).toBe(5160);
    expect(totals.discounts).toHaveLength(2);
    expect(totals.discountTotal).toBe(516 + 500);
    const netLines = totals.lines.map((l) => l.lineSubtotal - l.discountAmount);
    expect(netLines.reduce((a, b) => a + b, 0)).toBe(5160 - 1016);
    expect(totals.taxBreakdown.map((t) => t.rateBps)).toEqual([550, 2000]);
    expect(totals.total).toBe(5160 - 1016 + totals.taxTotal);
    expect(totals.freeShippingRemaining).toBeNull();
  });

  it("promotion commande sous le minimum → ignorée", () => {
    const auto = promo({ id: "auto", scope: "ORDER", type: "PERCENTAGE", valueBps: 1000, minOrderAmount: 100000, productIds: [] });
    const totals = calculateCartTotals({ lines: [line(2)], orderPromotions: [auto], coupon: null, shipping: null, shippingTaxRateBps: 2000, freeShippingThreshold: null });
    expect(totals.discountTotal).toBe(0);
  });

  it("panier vide", () => {
    const totals = calculateCartTotals({ lines: [], orderPromotions: [], coupon: null, shipping: { code: "std", name: "Standard", price: 990, freeAbove: null }, shippingTaxRateBps: 2000, freeShippingThreshold: 30000 });
    expect(totals.total).toBe(0);
    expect(totals.shippingTotal).toBe(0);
  });
});
