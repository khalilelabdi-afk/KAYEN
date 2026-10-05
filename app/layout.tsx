import type { Metadata, Viewport } from "next";
import { fontSans, fontDisplay } from "./fonts";
import "./globals.css";
import { siteConfig } from "@/lib/config/site";
import { getLocale } from "@/i18n/server";
import { localeConfig } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { Providers } from "@/components/layout/providers";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: getDictionary("fr").common.meta.defaultTitle, template: getDictionary("fr").common.meta.titleTemplate },
  description: getDictionary("fr").common.meta.defaultDescription,
  applicationName: siteConfig.name,
  openGraph: { type: "website", siteName: siteConfig.name, locale: "fr_FR" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const { dir, htmlLang } = localeConfig[locale];
  return (
    <html lang={htmlLang} dir={dir} className={`${fontSans.variable} ${fontDisplay.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
