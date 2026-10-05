import { siteConfig } from "@/lib/config/site";

/**
 * Tous les montants sont manipulés en unités mineures (centimes), entiers.
 * Ce module est la seule source de formatage monétaire.
 */

export interface MoneyFormatOptions {
  currency?: string;
  locale?: string;
  /** Afficher les décimales même si nulles (par défaut oui). */
  minimumFractionDigits?: number;
}

export function formatMoney(minor: number, opts: MoneyFormatOptions = {}): string {
  const currency = opts.currency ?? siteConfig.currency;
  const locale = opts.locale ?? siteConfig.currencyLocale;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: opts.minimumFractionDigits ?? 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

/** Formate un montant avec son suffixe fiscal : "18,90 € HT". */
export function formatPrice(minor: number, opts: MoneyFormatOptions & { taxLabel?: string | null } = {}) {
  const label = opts.taxLabel === undefined ? siteConfig.taxDisplay : opts.taxLabel;
  const base = formatMoney(minor, opts);
  return label ? `${base} ${label}` : base;
}

/** Applique un taux en points de base (2000 = 20 %) avec arrondi au centime. */
export function applyBps(minor: number, bps: number): number {
  return Math.round((minor * bps) / 10_000);
}

/** Pourcentage entier d'économie entre deux prix (ex : 12,90 → 11,90 = 8). */
export function savingsPercent(reference: number, price: number): number {
  if (reference <= 0 || price >= reference) return 0;
  return Math.round(((reference - price) / reference) * 100);
}

export function formatPercent(value: number, locale = siteConfig.currencyLocale) {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(value / 100);
}

/** Convertit une saisie "18,90" / "18.90" en centimes. */
export function parseMoneyInput(value: string): number | null {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  return Math.round(Number.parseFloat(normalized) * 100);
}

/** Convertit des centimes en chaîne de saisie "18.90". */
export function toMoneyInput(minor: number): string {
  return (minor / 100).toFixed(2);
}
