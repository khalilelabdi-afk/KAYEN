/**
 * Types du moteur de prix. Montants en centimes HT, taux en points de base.
 * Aucune dépendance à Prisma : le moteur est pur et testable.
 */

export type PromotionType = "PERCENTAGE" | "FIXED_AMOUNT" | "SPECIAL_PRICE" | "BUNDLE" | "CLEARANCE" | "QUANTITY";
export type PromotionScope = "ORDER" | "PRODUCT" | "CATEGORY" | "BRAND";

export interface PricingTier {
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
}

export interface PricingPromotion {
  id: string;
  name: string;
  type: PromotionType;
  scope: PromotionScope;
  valueBps: number | null;
  valueAmount: number | null;
  specialPrice: number | null;
  minQuantity: number | null;
  minOrderAmount: number | null;
  priority: number;
  isAutomatic: boolean;
  showBadge: boolean;
  badgeLabel: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  customerGroupId: string | null;
  /** Cibles pré-résolues (ids). Vides pour scope ORDER. */
  productIds: string[];
  categoryIds: string[];
  brandIds: string[];
}

export interface CustomerPriceRule {
  businessId: string | null;
  customerGroupId: string | null;
  minQuantity: number;
  unitPrice: number;
  startsAt: Date | null;
  endsAt: Date | null;
}

export interface PricingContext {
  isAuthenticated: boolean;
  businessId: string | null;
  customerGroupId: string | null;
  /** Remise globale du groupe client (bps). */
  groupDiscountBps: number;
  now: Date;
}

export interface VariantPricingInput {
  variantId: string;
  productId: string;
  /** Ids de la catégorie et de ses ancêtres (pour les promos catégorie). */
  categoryIds: string[];
  brandId: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  moq: number;
  orderMultiple: number;
  quoteOnlyAbove: number | null;
  tiers: PricingTier[];
  customerPrices: CustomerPriceRule[];
  taxRateBps: number;
  requiresAccount: boolean;
}

export type PriceSource = "contract" | "group" | "promotion" | "group_discount" | "tier" | "base";

export interface NextTierInfo {
  tier: PricingTier;
  quantityToAdd: number;
  /** Économie (%) du palier suivant par rapport au prix unitaire actuel. */
  savingsPercent: number;
}

export interface UnitPriceResult {
  variantId: string;
  quantity: number;
  /** Prix unitaire appliqué (HT). */
  unitPrice: number;
  /** Prix public de référence (variant.basePrice) pour afficher l'économie. */
  baseUnitPrice: number;
  /** Prix barré si promotion (compareAtPrice ou prix avant promo). */
  compareAtUnitPrice: number | null;
  source: PriceSource;
  activeTier: PricingTier | null;
  nextTier: NextTierInfo | null;
  promotion: PricingPromotion | null;
  savingsPercent: number;
  requiresQuote: boolean;
  /** Prix masqué (compte professionnel requis). */
  hidden: boolean;
  taxRateBps: number;
}

export interface TierTableRow {
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
  savingsPercent: number;
  isActive: boolean;
  requiresQuote: boolean;
}

export interface LineInput {
  variantId: string;
  productId: string;
  quantity: number;
  pricing: VariantPricingInput;
}

export interface LineResult {
  variantId: string;
  productId: string;
  quantity: number;
  unit: UnitPriceResult;
  /** unitPrice × quantity */
  lineSubtotal: number;
  /** basePrice × quantity */
  baseSubtotal: number;
  /** économies vs prix public */
  savings: number;
  taxRateBps: number;
}

export interface CartDiscountResult {
  promotionId: string;
  name: string;
  amount: number;
  isCoupon: boolean;
  code: string | null;
}

export interface ShippingOption {
  code: string;
  name: string;
  price: number;
  freeAbove: number | null;
}

export interface CartTotalsInput {
  lines: LineResult[];
  /** Promotions de scope ORDER automatiques actives. */
  orderPromotions: PricingPromotion[];
  /** Coupon validé (promotion + code) ou null. */
  coupon: { code: string; promotion: PricingPromotion } | null;
  shipping: ShippingOption | null;
  /** Taux de TVA appliqué à la livraison (bps). */
  shippingTaxRateBps: number;
  /** Franco global (centimes HT) — null si désactivé. */
  freeShippingThreshold: number | null;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  discounts: CartDiscountResult[];
  savingsTotal: number;
  shippingTotal: number;
  shippingIsFree: boolean;
  /** Montant HT restant pour atteindre le franco (0 si atteint, null si pas de franco). */
  freeShippingRemaining: number | null;
  taxTotal: number;
  /** Détail TVA par taux. */
  taxBreakdown: { rateBps: number; base: number; amount: number }[];
  total: number;
  /** Lignes avec montants après remise et TVA (pour la commande). */
  lines: (LineResult & { discountAmount: number; taxAmount: number; lineTotal: number })[];
}
