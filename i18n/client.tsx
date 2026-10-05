"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createTranslator, type Translator } from "./index";
import { defaultLocale, type Locale } from "./config";

const I18nContext = createContext<Translator | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = useMemo(() => createTranslator(locale), [locale]);
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

/** Traducteur côté client. Fonctionne aussi hors provider (locale par défaut). */
export function useT(): Translator {
  const ctx = useContext(I18nContext);
  return useMemo(() => ctx ?? createTranslator(defaultLocale), [ctx]);
}
