/**
 * Moteur de prix KAYEN — source de vérité unique.
 *
 * Priorité tarifaire (du plus prioritaire au moins prioritaire) :
 *  1. Prix contractuel entreprise (CustomerPrice.businessId) — échelle par quantité.
 *  2. Prix de groupe client explicite (CustomerPrice.customerGroupId).
 *  3. Prix public : palier de quantité (PriceTier) sinon prix de base.
 *     Sur ce prix public, le client obtient LE MEILLEUR de :
 *       a) la remise globale de son groupe (CustomerGroup.discountBps) ;
 *       b) la meilleure promotion produit / catégorie / marque active.
 *     Les deux ne se cumulent jamais.
 *  4. Les promotions de scope ORDER et les coupons s'appliquent ensuite sur le
 *     sous-total du panier (voir calculateCartTotals).
 *
 * Toutes les pages (carte produit, PDP, panier, checkout, commande, admin)
 * doivent passer par ces fonctions.
 */
import type {
  VariantPricingInput,
  PricingContext,
  UnitPriceResult,
  PricingPromotion,
  TierTableRow,
  LineInput,
  LineResult,
  CartTotalsInput,
  CartTotals,
  CartDiscountResult,
  PricingTier,
} from "./types";
import { normalizeQuantity } from "./quantity";
import { findActiveTier, findNextTier, sortTiers } from "./tiers";
import { bestProductPromotion, isPromotionActive, promotionTargetsProduct, applyOrderPromotion } from "./promotions";
import { applyBps, savingsPercent } from "@/lib/money";

function ruleIsActive(rule: { startsAt: Date | null; endsAt: Date | null }, now: Date) {
  if (rule.startsAt && rule.startsAt > now) return false;
  if (rule.endsAt && rule.endsAt < now) return false;
  return true;
}

/** Échelle de prix contractuels applicable (entreprise ou groupe) sous forme de paliers. */
function contractLadder(input: VariantPricingInput, ctx: PricingContext): { tiers: PricingTier[]; source: "contract" | "group" } | null {
  const active = input.customerPrices.filter((r) => ruleIsActive(r, ctx.now));
  if (ctx.businessId) {
    const rules = active.filter((r) => r.businessId === ctx.businessId);
    if (rules.length) {
      return { tiers: rules.map((r) => ({ minQuantity: r.minQuantity, maxQuantity: null, unitPrice: r.unitPrice })), source: "contract" };
    }
  }
  if (ctx.customerGroupId) {
    const rules = active.filter((r) => r.businessId === null && r.customerGroupId === ctx.customerGroupId);
    if (rules.length) {
      return { tiers: rules.map((r) => ({ minQuantity: r.minQuantity, maxQuantity: null, unitPrice: r.unitPrice })), source: "group" };
    }
  }
  return null;
}

/** Promotions applicables au produit (actives, ciblées, non ORDER). */
export function applicableProductPromotions(input: VariantPricingInput, promotions: PricingPromotion[], ctx: PricingContext): PricingPromotion[] {
  return promotions.filter(
    (p) =>
      p.scope !== "ORDER" &&
      p.isAutomatic &&
      isPromotionActive(p, ctx) &&
      promotionTargetsProduct(p, { productId: input.productId, categoryIds: input.categoryIds, brandId: input.brandId }),
  );
}

/**
 * Calcule le prix unitaire HT d'une variante pour une quantité et un client.
 */
export function calculateUnitPrice(
  input: VariantPricingInput,
  requestedQuantity: number,
  ctx: PricingContext,
  promotions: PricingPromotion[] = [],
): UnitPriceResult {
  const quantity = normalizeQuantity(requestedQuantity, input.moq, input.orderMultiple);
  const hidden = input.requiresAccount && !ctx.isAuthenticated;
  const requiresQuote = input.quoteOnlyAbove !== null && quantity >= input.quoteOnlyAbove;

  const base: UnitPriceResult = {
    variantId: input.variantId,
    quantity,
    unitPrice: input.basePrice,
    baseUnitPrice: input.basePrice,
    compareAtUnitPrice: input.compareAtPrice && input.compareAtPrice > input.basePrice ? input.compareAtPrice : null,
    source: "base",
    activeTier: null,
    nextTier: null,
    promotion: null,
    savingsPercent: 0,
    requiresQuote,
    hidden,
    taxRateBps: input.taxRateBps,
  };

  if (hidden) return base;

  // 1–2. Prix contractuel / de groupe explicite
  const ladder = contractLadder(input, ctx);
  if (ladder) {
    const tiers = sortTiers(ladder.tiers);
    const active = findActiveTier(tiers, quantity) ?? tiers[0];
    const unitPrice = Math.min(active.unitPrice, input.basePrice);
    return {
      ...base,
      unitPrice,
      source: ladder.source,
      activeTier: active,
      nextTier: findNextTier(tiers, quantity, unitPrice),
      savingsPercent: savingsPercent(input.basePrice, unitPrice),
    };
  }

  // 3. Prix public : palier ou base
  const tiers = sortTiers(input.tiers);
  const activeTier = findActiveTier(tiers, quantity);
  const listPrice = activeTier ? Math.min(activeTier.unitPrice, input.basePrice) : input.basePrice;
  let unitPrice = listPrice;
  let source: UnitPriceResult["source"] = activeTier ? "tier" : "base";
  let promotion: PricingPromotion | null = null;

  // a) remise de groupe
  const groupPrice = ctx.groupDiscountBps > 0 ? listPrice - applyBps(listPrice, ctx.groupDiscountBps) : listPrice;
  // b) meilleure promotion produit
  const promoCandidates = applicableProductPromotions(input, promotions, ctx);
  const bestPromo = bestProductPromotion(promoCandidates, listPrice, quantity);

  if (bestPromo && bestPromo.unitPrice < groupPrice) {
    unitPrice = bestPromo.unitPrice;
    promotion = bestPromo.promotion;
    source = "promotion";
  } else if (groupPrice < listPrice) {
    unitPrice = groupPrice;
    source = "group_discount";
  }

  const nextTier = findNextTier(tiers, quantity, listPrice);
  const compareAt = promotion ? listPrice : base.compareAtUnitPrice;

  return {
    ...base,
    unitPrice,
    compareAtUnitPrice: compareAt && compareAt > unitPrice ? compareAt : null,
    source,
    activeTier,
    nextTier,
    promotion,
    savingsPercent: savingsPercent(input.basePrice, unitPrice),
  };
}

/** Prix "à partir de" (meilleur prix unitaire atteignable au-delà du MOQ). */
export function calculateStartingPrice(input: VariantPricingInput, ctx: PricingContext, promotions: PricingPromotion[] = []): UnitPriceResult {
  const atMoq = calculateUnitPrice(input, input.moq, ctx, promotions);
  return atMoq;
}

/** Tableau des paliers à afficher sur la fiche produit, avec palier actif. */
export function buildTierTable(
  input: VariantPricingInput,
  quantity: number,
  ctx: PricingContext,
  promotions: PricingPromotion[] = [],
): TierTableRow[] {
  const ladder = contractLadder(input, ctx);
  const tiers = sortTiers(ladder ? ladder.tiers : input.tiers);
  const normalized = normalizeQuantity(quantity, input.moq, input.orderMultiple);

  const rows: TierTableRow[] = [];
  const hasFirstTierAtMoq = tiers.length > 0 && tiers[0].minQuantity <= input.moq;
  if (!hasFirstTierAtMoq) {
    const upper = tiers.length ? tiers[0].minQuantity - 1 : null;
    rows.push({ minQuantity: input.moq, maxQuantity: upper, unitPrice: input.basePrice, savingsPercent: 0, isActive: false, requiresQuote: false });
  }
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const next = tiers[i + 1];
    rows.push({
      minQuantity: tier.minQuantity,
      maxQuantity: tier.maxQuantity ?? (next ? next.minQuantity - 1 : null),
      unitPrice: tier.unitPrice,
      savingsPercent: 0,
      isActive: false,
      requiresQuote: false,
    });
  }
  if (input.quoteOnlyAbove !== null) {
    // Tronque les paliers au seuil de devis et ajoute la ligne "sur devis"
    const threshold = input.quoteOnlyAbove;
    for (const row of rows) {
      if (row.maxQuantity === null || row.maxQuantity >= threshold) row.maxQuantity = threshold - 1;
    }
    rows.push({ minQuantity: threshold, maxQuantity: null, unitPrice: 0, savingsPercent: 0, isActive: false, requiresQuote: true });
  }
  const reference = rows[0]?.unitPrice ?? input.basePrice;
  for (const row of rows) {
    // Promotions & remise de groupe appliquées pour un affichage cohérent avec le prix réel
    if (!row.requiresQuote) {
      const price = calculateUnitPrice(input, row.minQuantity, ctx, promotions).unitPrice;
      row.unitPrice = price;
    }
    row.savingsPercent = row.requiresQuote ? 0 : savingsPercent(reference, row.unitPrice);
    row.isActive = normalized >= row.minQuantity && (row.maxQuantity === null || normalized <= row.maxQuantity);
  }
  return rows.filter((r) => r.maxQuantity === null || r.maxQuantity >= r.minQuantity);
}

/** Calcule une ligne (quantité × prix unitaire). */
export function calculateLine(line: LineInput, ctx: PricingContext, promotions: PricingPromotion[] = []): LineResult {
  const unit = calculateUnitPrice(line.pricing, line.quantity, ctx, promotions);
  const quantity = unit.quantity;
  const lineSubtotal = unit.unitPrice * quantity;
  const baseSubtotal = unit.baseUnitPrice * quantity;
  return {
    variantId: line.variantId,
    productId: line.productId,
    quantity,
    unit,
    lineSubtotal,
    baseSubtotal,
    savings: Math.max(0, baseSubtotal - lineSubtotal),
    taxRateBps: unit.taxRateBps,
  };
}

/** Répartit un montant sur des lignes proportionnellement (méthode du plus fort reste). */
export function allocateProportionally(amount: number, weights: number[]): number[] {
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0 || amount <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (amount * w) / total);
  const floored = raw.map((r) => Math.floor(r));
  let remainder = amount - floored.reduce((s, f) => s + f, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (remainder <= 0) break;
    floored[i] += 1;
    remainder -= 1;
  }
  return floored;
}

/**
 * Totaux du panier / de la commande.
 * Remises de niveau commande : la meilleure promotion automatique ORDER + un coupon (cumulables).
 */
export function calculateCartTotals(input: CartTotalsInput): CartTotals {
  const lines = input.lines;
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = lines.reduce((s, l) => s + l.lineSubtotal, 0);
  const savingsFromPricing = lines.reduce((s, l) => s + l.savings, 0);

  const discounts: CartDiscountResult[] = [];
  let bestAuto: CartDiscountResult | null = null;
  for (const promo of input.orderPromotions) {
    if (!promo.isAutomatic || promo.scope !== "ORDER") continue;
    const amount = applyOrderPromotion(promo, subtotal);
    if (amount <= 0) continue;
    if (!bestAuto || amount > bestAuto.amount) {
      bestAuto = { promotionId: promo.id, name: promo.name, amount, isCoupon: false, code: null };
    }
  }
  if (bestAuto) discounts.push(bestAuto);

  if (input.coupon) {
    const remaining = subtotal - (bestAuto?.amount ?? 0);
    const amount = Math.min(remaining, applyOrderPromotion(input.coupon.promotion, subtotal));
    if (amount > 0) {
      discounts.push({ promotionId: input.coupon.promotion.id, name: input.coupon.promotion.name, amount, isCoupon: true, code: input.coupon.code });
    }
  }
  const discountTotal = Math.min(subtotal, discounts.reduce((s, d) => s + d.amount, 0));

  // Répartition de la remise commande sur les lignes pour une TVA exacte
  const allocations = allocateProportionally(discountTotal, lines.map((l) => l.lineSubtotal));
  const taxMap = new Map<number, { base: number; amount: number }>();
  const detailedLines = lines.map((line, i) => {
    const discountAmount = allocations[i] ?? 0;
    const taxable = line.lineSubtotal - discountAmount;
    const taxAmount = applyBps(taxable, line.taxRateBps);
    const entry = taxMap.get(line.taxRateBps) ?? { base: 0, amount: 0 };
    entry.base += taxable;
    entry.amount += taxAmount;
    taxMap.set(line.taxRateBps, entry);
    return { ...line, discountAmount, taxAmount, lineTotal: taxable + taxAmount };
  });

  // Livraison
  const netSubtotal = subtotal - discountTotal;
  let shippingTotal = 0;
  let shippingIsFree = false;
  let freeShippingRemaining: number | null = null;
  const threshold = input.shipping?.freeAbove ?? input.freeShippingThreshold;
  if (threshold !== null && threshold > 0) {
    freeShippingRemaining = Math.max(0, threshold - netSubtotal);
  }
  if (input.shipping && lines.length > 0) {
    shippingIsFree = threshold !== null && threshold > 0 && netSubtotal >= threshold;
    shippingTotal = shippingIsFree ? 0 : input.shipping.price;
    if (shippingTotal > 0) {
      const shippingTax = applyBps(shippingTotal, input.shippingTaxRateBps);
      const entry = taxMap.get(input.shippingTaxRateBps) ?? { base: 0, amount: 0 };
      entry.base += shippingTotal;
      entry.amount += shippingTax;
      taxMap.set(input.shippingTaxRateBps, entry);
    }
  }

  const taxBreakdown = [...taxMap.entries()]
    .map(([rateBps, v]) => ({ rateBps, base: v.base, amount: v.amount }))
    .sort((a, b) => a.rateBps - b.rateBps);
  const taxTotal = taxBreakdown.reduce((s, t) => s + t.amount, 0);
  const total = netSubtotal + shippingTotal + taxTotal;

  return {
    itemCount,
    subtotal,
    discountTotal,
    discounts,
    savingsTotal: savingsFromPricing + discountTotal,
    shippingTotal,
    shippingIsFree,
    freeShippingRemaining,
    taxTotal,
    taxBreakdown,
    total,
    lines: detailedLines,
  };
}
