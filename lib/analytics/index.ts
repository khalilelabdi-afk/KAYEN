/**
 * Couche analytics abstraite (client). Branchez GA4 / Plausible / autre via
 * NEXT_PUBLIC_ANALYTICS_PROVIDER sans toucher aux composants.
 */
export type AnalyticsEvent =
  | { name: "view_item"; params: { item_id: string; item_name: string; price: number; currency: string } }
  | { name: "view_item_list"; params: { item_list_id: string; item_list_name: string; items: { item_id: string; item_name: string }[] } }
  | { name: "search"; params: { search_term: string; results?: number } }
  | { name: "select_item"; params: { item_id: string; item_name: string; item_list_id?: string } }
  | { name: "add_to_cart"; params: { item_id: string; item_name: string; quantity: number; price: number; currency: string } }
  | { name: "remove_from_cart"; params: { item_id: string; quantity: number } }
  | { name: "begin_checkout"; params: { value: number; currency: string; items: number } }
  | { name: "purchase"; params: { transaction_id: string; value: number; currency: string; items: number } }
  | { name: "request_quote"; params: { source: string; items: number } }
  | { name: "login"; params: { method: string } }
  | { name: "sign_up"; params: { method: string } }
  | { name: "add_to_list"; params: { item_id: string; list_id?: string } }
  | { name: "reorder"; params: { order_id: string; items: number } };

type Provider = "ga4" | "plausible" | "console" | "none";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

function provider(): Provider {
  const p = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
  if (p === "ga4" || p === "plausible") return p;
  return process.env.NODE_ENV === "development" ? "console" : "none";
}

export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  const p = provider();
  try {
    switch (p) {
      case "ga4":
        if (window.gtag) window.gtag("event", event.name, event.params);
        else (window.dataLayer ??= []).push({ event: event.name, ...event.params });
        break;
      case "plausible":
        window.plausible?.(event.name, { props: event.params as Record<string, unknown> });
        break;
      case "console":
        console.debug("[analytics]", event.name, event.params);
        break;
      default:
        break;
    }
  } catch {
    // l'analytics ne doit jamais casser l'interface
  }
}
