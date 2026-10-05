import { fr, type Dictionary } from "./dictionaries/fr";
import { en } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";
import { defaultLocale, localeConfig, type Locale } from "./config";
import type { PartialDictionary, LeafPaths } from "./types";

export type { Dictionary, Locale };
export type TranslationKey = LeafPaths<Dictionary>;
export type TranslationValues = Record<string, string | number>;

const partials: Record<Locale, PartialDictionary<Dictionary>> = { fr: {}, en, ar };

function deepMerge<T>(base: T, override: PartialDictionary<T> | undefined): T {
  if (!override) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    if (value && typeof value === "object" && current && typeof current === "object") {
      out[key] = deepMerge(current, value as PartialDictionary<typeof current>);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out as T;
}

const cache = new Map<Locale, Dictionary>();

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  const cached = cache.get(locale);
  if (cached) return cached;
  const dict = locale === "fr" ? fr : deepMerge(fr, partials[locale]);
  cache.set(locale, dict);
  return dict;
}

function resolve(dict: Dictionary, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

export function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const v = values[name];
    return v === undefined || v === null ? `{${name}}` : String(v);
  });
}

export type Translator = {
  (key: TranslationKey, values?: TranslationValues): string;
  /** Pluriel : utilise `${key}Plural` si count > 1 et que la clé existe. */
  plural: (key: TranslationKey, count: number, values?: TranslationValues) => string;
  /** Accès à une valeur d'enum (ex: statut) sans typage strict de la clé. */
  enum: (group: string, value: string) => string;
  dict: Dictionary;
  locale: Locale;
  dir: "ltr" | "rtl";
  intl: string;
};

export function createTranslator(locale: Locale = defaultLocale): Translator {
  const dict = getDictionary(locale);
  const t = ((key: TranslationKey, values?: TranslationValues) => {
    const raw = resolve(dict, key);
    if (raw === undefined) {
      if (process.env.NODE_ENV !== "production") console.warn(`[i18n] clé manquante : ${key}`);
      return key;
    }
    return interpolate(raw, values);
  }) as Translator;
  t.plural = (key, count, values) => {
    const pluralKey = `${key}Plural`;
    const raw = count > 1 ? (resolve(dict, pluralKey) ?? resolve(dict, key)) : resolve(dict, key);
    return interpolate(raw ?? key, { count, ...values });
  };
  t.enum = (group, value) => resolve(dict, `${group}.${value}`) ?? value;
  t.dict = dict;
  t.locale = locale;
  t.dir = localeConfig[locale].dir;
  t.intl = localeConfig[locale].intl;
  return t;
}
