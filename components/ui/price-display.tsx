import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface PriceDisplayProps {
  /** Montant en centimes HT. */
  amount: number;
  /** Prix barré (centimes), affiché si supérieur. */
  compareAt?: number | null;
  /** Suffixe fiscal : "HT" | "TTC" | null */
  taxLabel?: string | null;
  /** Suffixe d'unité : "/ bidon" */
  unitSuffix?: string | null;
  /** Préfixe : "À partir de" */
  prefix?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "default" | "promo";
  className?: string;
  currency?: string;
  locale?: string;
}

const sizes = {
  sm: "text-sm font-semibold",
  md: "t-price",
  lg: "t-price-lg",
  xl: "t-price-lg text-3xl",
};

/** Affichage de prix unique pour tout le site. */
export function PriceDisplay({ amount, compareAt, taxLabel = "HT", unitSuffix, prefix, size = "md", tone = "default", className, currency, locale }: PriceDisplayProps) {
  const showCompare = compareAt !== null && compareAt !== undefined && compareAt > amount;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", className)}>
      {prefix && <span className="text-xs font-normal text-muted">{prefix}</span>}
      <span className={cn(sizes[size], tone === "promo" && "text-promo")}>
        {formatMoney(amount, { currency, locale })}
        {taxLabel && <span className="ms-1 text-[0.7em] font-medium text-muted">{taxLabel}</span>}
      </span>
      {showCompare && <s className="text-xs text-subtle tnum">{formatMoney(compareAt, { currency, locale })}</s>}
      {unitSuffix && <span className="text-xs text-muted">{unitSuffix}</span>}
    </span>
  );
}
