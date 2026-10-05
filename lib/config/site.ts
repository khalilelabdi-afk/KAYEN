/**
 * Configuration centrale de KAYEN.
 * Les valeurs commerciales (téléphone, seuils, délais, TVA…) sont des valeurs
 * par défaut clairement identifiables. Elles peuvent être surchargées depuis
 * le back-office (table `Setting`) via `getSettings()` dans `services/settings`.
 */
export const siteConfig = {
  name: "KAYEN",
  domain: "kayen.com",
  tagline: "Tout ce dont votre business a besoin, en gros.",
  description:
    "KAYEN est le grossiste multi-catégories pensé pour les professionnels : des milliers de produits, des prix dégressifs selon les volumes et un approvisionnement simplifié.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  defaultLocale: "fr" as const,
  locales: ["fr", "en", "ar"] as const,
  currency: "EUR",
  currencyLocale: "fr-FR",
  /** "HT" = prix affichés hors taxes (B2B), "TTC" = toutes taxes comprises */
  taxDisplay: "HT" as "HT" | "TTC",
  /** Taux de TVA par défaut en points de base (2000 = 20 %) — à configurer selon le marché. */
  defaultTaxRateBps: 2000,
  taxIdLabel: "Numéro de TVA intracommunautaire",
  taxIdPlaceholder: "FR12345678901",
  defaultCountryCode: "FR",
  /** Franco de port (sous-total HT, centimes). À confirmer commercialement. */
  freeShippingThreshold: 30000,
  /** Délai indicatif par défaut. */
  defaultLeadTime: { minDays: 2, maxDays: 5 },
  /** Coordonnées — valeurs temporaires à remplacer par les données réelles. */
  supportEmail: "contact@kayen.com",
  supportPhone: "+33 0 00 00 00 00",
  supportHours: "Lun.–Ven. 9h–18h",
  salesEmail: "commercial@kayen.com",
  companyAddress: {
    line1: "Adresse à compléter",
    postalCode: "00000",
    city: "Ville",
    countryCode: "FR",
  },
  /** Seuil « commande minimum » global en centimes HT (0 = aucun). */
  minimumOrderAmount: 0,
  /** Validité par défaut d'un devis (jours). */
  quoteValidityDays: 30,
  /** Durée de session (jours). */
  sessionDays: 30,
  /** Pagination catalogue. */
  pageSize: 24,
  /** Un produit est « nouveau » pendant N jours après publication. */
  newProductDays: 45,
  social: {
    linkedin: "",
    instagram: "",
  },
} as const;

export type SiteConfig = typeof siteConfig;
export type Locale = (typeof siteConfig.locales)[number];
