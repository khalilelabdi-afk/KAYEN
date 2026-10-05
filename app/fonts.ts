import localFont from "next/font/local";

/**
 * Polices auto-hébergées (aucune requête externe, build hors-ligne possible).
 * Inter : corps de texte, interface et prix (chiffres tabulaires).
 * Manrope : titres et wordmark.
 */
export const fontSans = localFont({
  src: [
    { path: "./fonts/inter-latin-wght.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/inter-latin-ext-wght.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
});

export const fontDisplay = localFont({
  src: [
    { path: "./fonts/manrope-latin-wght.woff2", weight: "200 800", style: "normal" },
    { path: "./fonts/manrope-latin-ext-wght.woff2", weight: "200 800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  preload: true,
  fallback: ["Inter", "system-ui", "Arial", "sans-serif"],
});
