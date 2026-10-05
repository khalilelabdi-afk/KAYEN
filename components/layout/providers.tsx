"use client";

import { I18nProvider, useT } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

function Inner({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <ToastProvider closeLabel={t("common.actions.close")}>
      <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
    </ToastProvider>
  );
}

export function Providers({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <I18nProvider locale={locale}>
      <Inner>{children}</Inner>
    </I18nProvider>
  );
}
