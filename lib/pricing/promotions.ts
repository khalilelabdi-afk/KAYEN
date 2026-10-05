import type { PricingPromotion, PricingContext } from "./types";
import { applyBps } from "@/lib/money";

/** Une promotion est-elle active à l'instant t et pour ce contexte client ? */
export function isPromotionActive(promo: PricingPromotion, ctx: Pick<PricingContext, "now" | "customerGroupId">): boolean {
  if (promo.startsAt && promo.startsAt > ctx.now) return false;
  if (promo.endsAt && promo.endsAt < ctx.now) return false;
  if (promo.customerGroupId && promo.customerGroupId !== ctx.customerGroupId) return false;
  return true;
}

/** La promotion cible-t-elle ce produit ? */
export function promotionTargetsProduct(
  promo: PricingPromotion,
  target: { productId: string; categoryIds: string[]; brandId: string | null },
): boolean {
  switch (promo.scope) {
    case "PRODUCT":
      return promo.productIds.includes(target.productId);
    case "CATEGORY":
      return promo.categoryIds.some((id) => target.categoryIds.includes(id));
    case "BRAND":
      return target.brandId !== null && promo.brandIds.includes(target.brandId);
    case "ORDER":
    default:
      return false;
  }
}

/**
 * Prix unitaire résultant d'une promotion produit sur un prix de référence.
 * Retourne null si la promotion ne s'applique pas (quantité insuffisante, type non unitaire).
 */
export function applyProductPromotion(promo: PricingPromotion, referencePrice: number, quantity: number): number | null {
  if (promo.minQuantity && quantity < promo.minQuantity) return null;
  switch (promo.type) {
    case "PERCENTAGE":
    case "QUANTITY":
    case "BUNDLE":
      if (!promo.valueBps) return null;
      return Math.max(0, referencePrice - applyBps(referencePrice, promo.valueBps));
    case "FIXED_AMOUNT":
      if (!promo.valueAmount) return null;
      return Math.max(0, referencePrice - promo.valueAmount);
    case "SPECIAL_PRICE":
    case "CLEARANCE":
      if (promo.specialPrice === null) return null;
      return Math.min(referencePrice, promo.specialPrice);
    default:
      return null;
  }
}

/** Sélectionne la meilleure promotion produit (prix le plus bas, puis priorité). */
export function bestProductPromotion(
  promotions: PricingPromotion[],
  referencePrice: number,
  quantity: number,
): { promotion: PricingPromotion; unitPrice: number } | null {
  let best: { promotion: PricingPromotion; unitPrice: number } | null = null;
  for (const promo of promotions) {
    const price = applyProductPromotion(promo, referencePrice, quantity);
    if (price === null || price >= referencePrice) continue;
    if (!best || price < best.unitPrice || (price === best.unitPrice && promo.priority > best.promotion.priority)) {
      best = { promotion: promo, unitPrice: price };
    }
  }
  return best;
}

/** Montant de remise d'une promotion de scope ORDER sur un sous-total HT. */
export function applyOrderPromotion(promo: PricingPromotion, subtotal: number): number {
  if (promo.scope !== "ORDER") return 0;
  if (promo.minOrderAmount && subtotal < promo.minOrderAmount) return 0;
  switch (promo.type) {
    case "PERCENTAGE":
      return promo.valueBps ? Math.min(subtotal, applyBps(subtotal, promo.valueBps)) : 0;
    case "FIXED_AMOUNT":
      return promo.valueAmount ? Math.min(subtotal, promo.valueAmount) : 0;
    default:
      return 0;
  }
}
