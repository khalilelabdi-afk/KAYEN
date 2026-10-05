export const locales = ["fr", "en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export const localeConfig: Record<Locale, { label: string; dir: "ltr" | "rtl"; intl: string; htmlLang: string }> = {
  fr: { label: "Français", dir: "ltr", intl: "fr-FR", htmlLang: "fr" },
  en: { label: "English", dir: "ltr", intl: "en-GB", htmlLang: "en" },
  ar: { label: "العربية", dir: "rtl", intl: "ar-MA", htmlLang: "ar" },
};

export const LOCALE_COOKIE = "kayen_locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
