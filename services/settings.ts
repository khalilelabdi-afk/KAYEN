import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/config/site";

/**
 * Paramètres commerciaux : valeurs par défaut (siteConfig) surchargées par la table `Setting`.
 * Modifiables depuis /admin/settings. Cache invalidé par le tag "settings".
 */
export interface CommerceSettings {
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  salesEmail: string;
  companyAddress: { line1: string; postalCode: string; city: string; countryCode: string };
  freeShippingThreshold: number | null;
  minimumOrderAmount: number;
  quoteValidityDays: number;
  defaultLeadTime: { minDays: number; maxDays: number };
  taxIdLabel: string;
  taxIdPlaceholder: string;
  taxDisplay: "HT" | "TTC";
  currency: string;
  bankDetails: string;
  returnPolicy: string;
  announcement: string;
  newProductDays: number;
}

export const defaultSettings: CommerceSettings = {
  supportEmail: siteConfig.supportEmail,
  supportPhone: siteConfig.supportPhone,
  supportHours: siteConfig.supportHours,
  salesEmail: siteConfig.salesEmail,
  companyAddress: { ...siteConfig.companyAddress },
  freeShippingThreshold: siteConfig.freeShippingThreshold,
  minimumOrderAmount: siteConfig.minimumOrderAmount,
  quoteValidityDays: siteConfig.quoteValidityDays,
  defaultLeadTime: { ...siteConfig.defaultLeadTime },
  taxIdLabel: siteConfig.taxIdLabel,
  taxIdPlaceholder: siteConfig.taxIdPlaceholder,
  taxDisplay: siteConfig.taxDisplay,
  currency: siteConfig.currency,
  bankDetails: "[Coordonnées bancaires à renseigner dans l'administration]",
  returnPolicy: "Les conditions de retour sont précisées dans nos conditions générales de vente.",
  announcement: "",
  newProductDays: siteConfig.newProductDays,
};

export const SETTINGS_TAG = "settings";

export const getSettings = unstable_cache(
  async (): Promise<CommerceSettings> => {
    const rows = await db.setting.findMany();
    const overrides: Record<string, unknown> = {};
    for (const row of rows) overrides[row.key] = row.value;
    return mergeSettings(defaultSettings, overrides);
  },
  ["settings"],
  { tags: [SETTINGS_TAG], revalidate: 300 },
);

export function mergeSettings(base: CommerceSettings, overrides: Record<string, unknown>): CommerceSettings {
  const out: CommerceSettings = { ...base, companyAddress: { ...base.companyAddress }, defaultLeadTime: { ...base.defaultLeadTime } };
  for (const [key, value] of Object.entries(overrides)) {
    if (!(key in base) || value === null || value === undefined) continue;
    const k = key as keyof CommerceSettings;
    const current = out[k];
    if (typeof current === "object" && current !== null && typeof value === "object") {
      (out as unknown as Record<string, unknown>)[k] = { ...current, ...(value as object) };
    } else if (typeof current === typeof value || (current === null && typeof value === "number")) {
      (out as unknown as Record<string, unknown>)[k] = value;
    }
  }
  return out;
}

export async function setSetting(key: keyof CommerceSettings, value: unknown) {
  await db.setting.upsert({
    where: { key },
    create: { key, value: value as never },
    update: { value: value as never },
  });
}

/** Classe de TVA par défaut (bps). */
export const getDefaultTaxRateBps = unstable_cache(
  async (): Promise<number> => {
    const tax = await db.taxClass.findFirst({ where: { isDefault: true } });
    return tax?.rateBps ?? siteConfig.defaultTaxRateBps;
  },
  ["default-tax"],
  { tags: [SETTINGS_TAG, "taxes"], revalidate: 300 },
);

export const getShippingMethods = unstable_cache(
  async () => db.shippingMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ["shipping-methods"],
  { tags: [SETTINGS_TAG, "shipping"], revalidate: 300 },
);
