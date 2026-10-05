import type { PartialDictionary } from "@/i18n/types";
import type { Dictionary } from "../fr";

/**
 * Dictionnaire anglais — partiel. Toute clé absente retombe sur le français.
 * L'architecture est en place : il suffit de compléter ce fichier.
 */
export const en: PartialDictionary<Dictionary> = {
  common: {
    tagline: "Everything your business needs, wholesale.",
    actions: { addToCart: "Add to cart", requestQuote: "Request a quote", search: "Search", login: "Sign in", logout: "Sign out", register: "Create an account" },
    breadcrumb: { home: "Home" },
    skipToContent: "Skip to content",
  },
  nav: {
    header: { searchPlaceholder: "Search thousands of products...", allProducts: "All products", cart: "Cart", account: "Account" },
  },
  home: {
    hero: { title: "Everything for your business. Wholesale.", subtitle: "Thousands of professional products, volume pricing and simplified procurement.", ctaPrimary: "Browse products", ctaSecondary: "Request a quote" },
  },
};
