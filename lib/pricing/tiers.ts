import type { PricingTier, NextTierInfo } from "./types";
import { savingsPercent } from "@/lib/money";

/** Trie les paliers par quantité minimum croissante. */
export function sortTiers(tiers: PricingTier[]): PricingTier[] {
  return [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
}

/** Palier actif pour une quantité (le palier au minQuantity le plus élevé ≤ quantité). */
export function findActiveTier(tiers: PricingTier[], quantity: number): PricingTier | null {
  let active: PricingTier | null = null;
  for (const tier of sortTiers(tiers)) {
    if (quantity >= tier.minQuantity && (tier.maxQuantity === null || quantity <= tier.maxQuantity)) {
      active = tier;
    } else if (quantity >= tier.minQuantity && tier.maxQuantity !== null && quantity > tier.maxQuantity) {
      // quantité au-delà du palier : on retient le dernier palier atteint
      active = tier;
    }
  }
  return active;
}

/** Palier suivant (prix unitaire inférieur) et quantité à ajouter pour l'atteindre. */
export function findNextTier(tiers: PricingTier[], quantity: number, currentUnitPrice: number): NextTierInfo | null {
  const sorted = sortTiers(tiers);
  for (const tier of sorted) {
    if (tier.minQuantity > quantity && tier.unitPrice < currentUnitPrice) {
      return {
        tier,
        quantityToAdd: tier.minQuantity - quantity,
        savingsPercent: savingsPercent(currentUnitPrice, tier.unitPrice),
      };
    }
  }
  return null;
}

/** Meilleur prix unitaire atteignable via les paliers (pour "À partir de"). */
export function lowestTierPrice(basePrice: number, tiers: PricingTier[]): number {
  return tiers.reduce((min, t) => Math.min(min, t.unitPrice), basePrice);
}
