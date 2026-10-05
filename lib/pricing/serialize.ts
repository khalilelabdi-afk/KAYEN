import type { PricingContext, PricingPromotion } from "./types";

/** Versions sérialisables (dates ISO) pour transmettre le contexte de prix aux composants client. */
export interface ClientPricingContext extends Omit<PricingContext, "now"> {
  now: string;
}
export interface ClientPromotion extends Omit<PricingPromotion, "startsAt" | "endsAt"> {
  startsAt: string | null;
  endsAt: string | null;
}

export function serializeContext(ctx: PricingContext): ClientPricingContext {
  return { ...ctx, now: ctx.now.toISOString() };
}
export function deserializeContext(ctx: ClientPricingContext): PricingContext {
  return { ...ctx, now: new Date(ctx.now) };
}
export function serializePromotions(promos: PricingPromotion[]): ClientPromotion[] {
  return promos.map((p) => ({ ...p, startsAt: p.startsAt?.toISOString() ?? null, endsAt: p.endsAt?.toISOString() ?? null }));
}
export function deserializePromotions(promos: ClientPromotion[]): PricingPromotion[] {
  return promos.map((p) => ({ ...p, startsAt: p.startsAt ? new Date(p.startsAt) : null, endsAt: p.endsAt ? new Date(p.endsAt) : null }));
}
