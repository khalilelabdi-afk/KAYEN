import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createTranslator, type Translator } from "./index";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/** Locale courante (cookie) — lecture mémoïsée par requête. */
export const getLocale = cache(async (): Promise<Locale> => {
  try {
    const store = await cookies();
    const value = store.get(LOCALE_COOKIE)?.value;
    return isLocale(value) ? value : defaultLocale;
  } catch {
    return defaultLocale;
  }
});

/** Traducteur serveur (Server Components, actions, route handlers). */
export async function getT(): Promise<Translator> {
  const locale = await getLocale();
  return createTranslator(locale);
}
