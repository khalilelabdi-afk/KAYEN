/** Types partagés client/serveur pour le catalogue. */
import type { PriceSource } from "@/lib/pricing/types";

export type AvailabilityStatus = "in_stock" | "low_stock" | "backorder" | "out_of_stock";

export interface AvailabilityInfo {
  status: AvailabilityStatus;
  available: number;
  allowBackorder: boolean;
  leadTimeDays: number | null;
  restockAt: string | null;
}

export interface CardPrice {
  /** Prix unitaire au MOQ (centimes HT). */
  unitPrice: number;
  baseUnitPrice: number;
  compareAtUnitPrice: number | null;
  /** Meilleur prix unitaire atteignable via paliers. */
  lowestUnitPrice: number;
  hasTiers: boolean;
  /** Prochain palier depuis le MOQ : "-8 % dès 12 unités". */
  nextTier: { minQuantity: number; savingsPercent: number } | null;
  savingsPercent: number;
  source: PriceSource;
  promotionBadge: string | null;
  hidden: boolean;
  requiresQuote: boolean;
}

export interface ProductCardData {
  id: string;
  slug: string;
  sku: string;
  name: string;
  href: string;
  brand: { name: string; slug: string } | null;
  image: { url: string; alt: string } | null;
  variantId: string;
  hasVariants: boolean;
  variantCount: number;
  unitLabel: string;
  packagingLabel: string | null;
  moq: number;
  orderMultiple: number;
  price: CardPrice;
  availability: AvailabilityInfo;
  badges: { isNew: boolean; isPromo: boolean; isBestseller: boolean; isClearance: boolean };
}

export type SortKey = "relevance" | "popular" | "price_asc" | "price_desc" | "newest" | "promo" | "bestsellers" | "name_asc";

export interface FacetValue {
  value: string;
  label: string;
  count: number;
}

export interface AttributeFacet {
  code: string;
  name: string;
  unit: string | null;
  values: FacetValue[];
}

export interface ListingFacets {
  brands: FacetValue[];
  priceRange: { min: number; max: number } | null;
  attributes: AttributeFacet[];
  packagings: FacetValue[];
  units: FacetValue[];
  inStockCount: number;
  promoCount: number;
  newCount: number;
}

export interface ListingResult {
  items: ProductCardData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: ListingFacets;
}
