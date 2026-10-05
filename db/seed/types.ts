/**
 * Contrat des données de démonstration.
 * Les montants sont en centimes HT. Les quantités sont des entiers.
 */
export type PictogramKey =
  | "cup" | "bottle" | "box" | "roll" | "bag" | "spray" | "bucket" | "chair" | "desk" | "mat" | "dumbbell" | "towel"
  | "soap" | "plate" | "cutlery" | "machine" | "paper" | "gloves" | "trash" | "dispenser" | "lamp" | "rack" | "tray"
  | "container" | "broom" | "mop" | "sign" | "glass" | "lid" | "straw" | "napkin" | "apron" | "bin" | "cart" | "shelf"
  | "monitor" | "pen" | "notebook" | "folder" | "printer" | "bedding" | "pillow" | "hanger" | "kettle" | "kit" | "cone"
  | "tent" | "table" | "umbrella" | "mask" | "kettlebell" | "ball" | "band" | "bench" | "scale" | "generic";

/** Tonalité de fond du visuel (palette chaude cohérente). */
export type ImageTone = "sand" | "stone" | "sage" | "clay" | "mist" | "olive" | "linen" | "slate";

export interface SeedAttribute {
  code: string;
  name: string;
  type: "TEXT" | "NUMBER" | "SELECT" | "BOOLEAN";
  unit?: string;
  isFilterable?: boolean;
}

export interface SeedCategory {
  slug: string;
  name: string;
  description?: string;
  icon?: string; // nom d'icône lucide (kebab-case)
  showInNav?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  /** Codes d'attributs filtrables pour cette catégorie. */
  attributes?: string[];
  children?: SeedCategory[];
}

export interface SeedBrand {
  slug: string;
  name: string;
  description: string;
  isFeatured?: boolean;
  website?: string;
}

export interface SeedSector {
  slug: string;
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  description: string;
  icon: string;
  categorySlugs: string[];
  featuredSkus: string[];
  seoTitle: string;
  seoDescription: string;
}

export interface SeedTier {
  minQuantity: number;
  unitPrice: number;
}

export interface SeedVariant {
  sku: string;
  name: string;
  /** Valeurs d'options, ex. { Couleur: "Bleu", Volume: "5 L" } */
  options: Record<string, string>;
  basePrice?: number;
  compareAtPrice?: number;
  stock?: number;
  tiers?: SeedTier[];
  ean?: string;
  weightGrams?: number;
}

export interface SeedProduct {
  sku: string;
  name: string;
  brandSlug: string;
  categorySlug: string;
  shortDescription: string;
  /** Markdown, 2 à 5 paragraphes réalistes. */
  description: string;
  usageTips?: string;
  keywords: string[];
  unitLabel: string; // "bidon", "carton", "pièce", "rouleau", "lot", "sac"
  packagingLabel?: string; // "Carton de 12", "Lot de 50"
  unitsPerPack?: number;
  moq: number;
  orderMultiple?: number;
  basePrice: number;
  compareAtPrice?: number;
  costPrice?: number;
  tiers: SeedTier[];
  quoteOnlyAbove?: number;
  leadTimeDays?: number;
  stock: number;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
  weightGrams?: number;
  dimensionsMm?: [number, number, number];
  attributes: Record<string, string | number | boolean>;
  taxClass?: "standard" | "reduced";
  pictogram: PictogramKey;
  tone: ImageTone;
  /** Nombre d'images (1 à 3) générées pour le produit. */
  imageCount?: number;
  documents?: { type: "DATASHEET" | "SAFETY_SHEET" | "MANUAL" | "CERTIFICATE" | "OTHER"; name: string }[];
  faqs?: { question: string; answer: string }[];
  variants?: SeedVariant[];
  related?: { sku: string; type: "SIMILAR" | "FREQUENTLY_BOUGHT" | "COMPLEMENTARY" | "ACCESSORY" }[];
  salesCount?: number;
  /** Publié il y a N jours (pour "Nouveautés"). */
  publishedDaysAgo?: number;
  requiresAccount?: boolean;
  ean?: string;
}

export interface SeedPromotion {
  name: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "SPECIAL_PRICE" | "BUNDLE" | "CLEARANCE" | "QUANTITY";
  scope: "ORDER" | "PRODUCT" | "CATEGORY" | "BRAND";
  valueBps?: number;
  valueAmount?: number;
  specialPrice?: number;
  minQuantity?: number;
  minOrderAmount?: number;
  isAutomatic?: boolean;
  couponCodes?: string[];
  daysValid?: number;
  productSkus?: string[];
  categorySlugs?: string[];
  brandSlugs?: string[];
  badgeLabel?: string;
}

export interface SeedGuide {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // markdown
  categorySlug: string;
  authorName: string;
  readingMinutes: number;
  relatedSkus: string[];
  tone: ImageTone;
  pictogram: PictogramKey;
  publishedDaysAgo: number;
}

export interface SeedGuideCategory {
  slug: string;
  name: string;
}

export interface SeedFaq {
  category: "commande" | "compte" | "prix" | "livraison" | "devis" | "paiement" | "facturation" | "retours" | "disponibilite";
  question: string;
  answer: string;
}

export interface SeedPage {
  slug: string;
  title: string;
  excerpt?: string;
  content: string; // markdown
  showInFooter?: boolean;
}

export interface SeedSynonym {
  term: string;
  synonyms: string[];
}
