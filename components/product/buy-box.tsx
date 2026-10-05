"use client";

import * as React from "react";
import Link from "next/link";
import { Check, FileText, Truck, ShieldCheck, Headset, ShoppingCart } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { formatMoney, applyBps } from "@/lib/money";
import { calculateUnitPrice, buildTierTable } from "@/lib/pricing/engine";
import { normalizeQuantity } from "@/lib/pricing/quantity";
import { deserializeContext, deserializePromotions, type ClientPricingContext, type ClientPromotion } from "@/lib/pricing/serialize";
import type { VariantView } from "@/services/catalog/product";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { Badge } from "@/components/ui/badge";
import { AvailabilityBadge } from "@/components/commerce/availability-badge";
import { AddToListButton } from "@/components/commerce/add-to-list-button";
import { useAddToCart } from "@/components/commerce/use-add-to-cart";
import { track } from "@/lib/analytics";

export interface BuyBoxProps {
  productName: string;
  productSlug: string;
  brand: { name: string; slug: string } | null;
  hasVariants: boolean;
  options: { id: string; name: string; values: string[] }[];
  variants: VariantView[];
  ctx: ClientPricingContext;
  promotions: ClientPromotion[];
  taxDisplay: "HT" | "TTC";
  freeShippingThreshold: number | null;
  leadTime: { minDays: number; maxDays: number };
  shortDescription: string | null;
  onVariantChange?: (variantId: string) => void;
}

/**
 * Bloc d'achat : variantes, prix recalculé en direct par le moteur de prix (même logique que le serveur),
 * paliers, quantité, économies, CTA panier / devis / liste, barre sticky mobile.
 */
export function BuyBox(props: BuyBoxProps) {
  const t = useT();
  const ctx = React.useMemo(() => deserializeContext(props.ctx), [props.ctx]);
  const promotions = React.useMemo(() => deserializePromotions(props.promotions), [props.promotions]);
  const defaultVariant = props.variants.find((v) => v.isDefault) ?? props.variants[0];
  const [variantId, setVariantId] = React.useState(defaultVariant.id);
  const variant = props.variants.find((v) => v.id === variantId) ?? defaultVariant;
  const [quantity, setQuantity] = React.useState(variant.moq);
  const [lastVariantId, setLastVariantId] = React.useState(variant.id);
  const { add, pending, justAdded } = useAddToCart();
  if (variant.id !== lastVariantId) {
    setLastVariantId(variant.id);
    setQuantity(normalizeQuantity(quantity, variant.moq, variant.orderMultiple));
  }

  const price = React.useMemo(() => calculateUnitPrice(variant.pricing, quantity, ctx, promotions), [variant.pricing, quantity, ctx, promotions]);
  const tierTable = React.useMemo(() => buildTierTable(variant.pricing, quantity, ctx, promotions), [variant.pricing, quantity, ctx, promotions]);
  const lineTotal = price.unitPrice * price.quantity;
  const savings = (price.baseUnitPrice - price.unitPrice) * price.quantity;
  const canBuy = !price.hidden && !price.requiresQuote && variant.availability.status !== "out_of_stock";
  const available = variant.availability.allowBackorder ? undefined : variant.availability.available;
  const unitTtc = price.unitPrice + applyBps(price.unitPrice, variant.pricing.taxRateBps);
  const unitWord = variant.unitLabel;

  const selectVariant = (id: string) => {
    setVariantId(id);
    props.onVariantChange?.(id);
  };

  const onAdd = () => add({ variantId: variant.id, quantity, name: props.productName, unitPrice: price.unitPrice, sku: variant.sku });

  React.useEffect(() => {
    track({ name: "view_item", params: { item_id: variant.sku, item_name: props.productName, price: price.unitPrice / 100, currency: "EUR" } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant.sku]);

  const priceBlock = price.hidden ? (
    <div className="rounded-lg border border-border bg-paper p-4">
      <p className="text-sm font-medium">{t("catalog.pdp.loginForPrice")}</p>
      <div className="mt-3 flex gap-2">
        <Button asChild size="sm"><Link href={`/login?next=/p/${props.productSlug}`}>{t("catalog.pdp.loginCta")}</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href="/register">{t("catalog.pdp.registerCta")}</Link></Button>
      </div>
    </div>
  ) : (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="t-label text-muted">{price.source === "contract" || price.source === "group" ? t("catalog.card.contractPrice") : t("catalog.pdp.priceLabel")}</p>
        {price.promotion?.showBadge && <Badge variant="promo">{price.promotion.badgeLabel ?? (price.promotion.valueBps ? `-${Math.round(price.promotion.valueBps / 100)} %` : t("catalog.card.promo"))}</Badge>}
      </div>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className={cn("t-price-lg", price.source === "promotion" && "text-promo")}>
          {formatMoney(props.taxDisplay === "TTC" ? unitTtc : price.unitPrice)}
          <span className="ms-1.5 text-sm font-medium text-muted">{props.taxDisplay}</span>
        </span>
        {price.compareAtUnitPrice && <s className="text-sm text-subtle tnum">{formatMoney(price.compareAtUnitPrice)}</s>}
        <span className="text-sm text-muted">{t("catalog.pdp.perUnit", { unit: unitWord })}</span>
      </p>
      <p className="mt-1 text-xs text-muted">
        {props.taxDisplay === "HT" ? t("catalog.pdp.priceTtcInfo", { price: formatMoney(unitTtc) }) : `${formatMoney(price.unitPrice)} ${t("common.labels.taxExcluded")}`}
        {variant.unitsPerPack && variant.unitsPerPack > 1 && <> · {t("catalog.pdp.perElementaryUnit", { price: formatMoney(Math.round(price.unitPrice / variant.unitsPerPack)), unit: t("common.units.unit") })}</>}
      </p>
      {price.savingsPercent > 0 && (
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          {t("catalog.pdp.savings", { amount: formatMoney(savings) })} <span className="rounded-sm bg-accent-soft px-1.5 py-0.5 text-xs">{t("catalog.pdp.savingsPercent", { percent: price.savingsPercent })}</span>
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        {props.brand && <Link href={`/brand/${props.brand.slug}`} className="t-label text-muted hover:text-foreground">{props.brand.name}</Link>}
        <h1 className="t-h1 mt-1">{props.productName}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>{t("catalog.pdp.sku", { sku: variant.sku })}</span>
          {variant.ean && <span>{t("catalog.pdp.ean", { ean: variant.ean })}</span>}
          <AvailabilityBadge availability={{ ...variant.availability, leadTimeDays: variant.leadTimeDays }} showCount />
        </p>
        {props.shortDescription && <p className="mt-3 text-sm text-foreground/85">{props.shortDescription}</p>}
      </div>

      {props.hasVariants && props.options.length > 0 && (
        <div className="space-y-3">
          {props.options.map((opt) => {
            const currentValue = variant.options[opt.name];
            return (
              <fieldset key={opt.id}>
                <legend className="mb-1.5 text-sm font-medium">{opt.name} : <span className="font-normal text-muted">{currentValue}</span></legend>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map((value) => {
                    const candidate = props.variants.find((v) => v.options[opt.name] === value && Object.entries(variant.options).every(([k, val]) => k === opt.name || v.options[k] === val)) ?? props.variants.find((v) => v.options[opt.name] === value);
                    const selected = currentValue === value;
                    const disabled = !candidate;
                    return (
                      <button key={value} type="button" disabled={disabled} aria-pressed={selected} onClick={() => candidate && selectVariant(candidate.id)} className={cn("h-9 rounded-md border px-3 text-sm transition-colors", selected ? "border-ink bg-ink text-white" : "border-border-strong bg-surface hover:border-ink", disabled && "cursor-not-allowed opacity-40", candidate?.availability.status === "out_of_stock" && !selected && "line-through")}>
                        {value}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
      )}

      {priceBlock}

      {!price.hidden && (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg border border-border bg-surface p-3 text-xs">
            <dt className="text-muted">{t("catalog.pdp.packaging")}</dt><dd className="font-medium">{variant.packagingLabel ?? variant.unitLabel}</dd>
            <dt className="text-muted">{t("common.labels.minimum")}</dt><dd className="font-medium">{variant.moq} {unitWord}{variant.moq > 1 ? "s" : ""}{variant.orderMultiple > 1 && ` · ${t("catalog.pdp.multiple", { step: variant.orderMultiple })}`}</dd>
            <dt className="text-muted">{t("catalog.pdp.leadTimeLabel")}</dt><dd className="font-medium">{variant.leadTimeDays ? t("common.availability.leadTimeDays", { days: variant.leadTimeDays }).replace(/^Délai : /, "") : t("catalog.pdp.delivery", { min: props.leadTime.minDays, max: props.leadTime.maxDays }).replace(/^Livraison estimée : /, "")}</dd>
            {props.freeShippingThreshold && <><dt className="text-muted">{t("catalog.pdp.freeShippingLabel")}</dt><dd className="font-medium">{t("catalog.pdp.freeShippingFrom", { amount: formatMoney(props.freeShippingThreshold) }).replace(/^Franco /, "")}</dd></>}
          </dl>

          <TierTable rows={tierTable} unit={unitWord} />

          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            {price.requiresQuote ? (
              <p className="text-sm text-muted">{t("catalog.pdp.quoteRequired", { count: variant.pricing.quoteOnlyAbove ?? 0, unit: `${unitWord}s` })}</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted">{t("catalog.pdp.quantity")}</p>
                    <QuantitySelector value={quantity} onChange={setQuantity} moq={variant.moq} step={variant.orderMultiple} max={available} size="lg" disabled={!canBuy} labels={{ decrease: t("catalog.card.decrease"), increase: t("catalog.card.increase"), quantity: t("catalog.pdp.quantity") }} />
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-muted">{t("catalog.pdp.lineTotal")}</p>
                    <p className="t-price-lg">{formatMoney(lineTotal)} <span className="text-sm font-medium text-muted">{t("common.labels.taxExcluded")}</span></p>
                  </div>
                </div>
                {price.nextTier ? (
                  <p className="rounded-md bg-accent-softer px-3 py-2 text-xs font-medium text-accent">{t("catalog.pdp.nextTier", { count: price.nextTier.quantityToAdd, unit: `${unitWord}${price.nextTier.quantityToAdd > 1 ? "s" : ""}`, percent: price.nextTier.savingsPercent })}</p>
                ) : price.activeTier ? (
                  <p className="rounded-md bg-accent-softer px-3 py-2 text-xs font-medium text-accent">{t("catalog.pdp.bestTier")}</p>
                ) : null}
              </>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              {price.requiresQuote ? (
                <Button asChild size="lg" className="flex-1"><Link href={`/quote?sku=${encodeURIComponent(variant.sku)}&qty=${quantity}`}><FileText />{t("catalog.pdp.requestQuote")}</Link></Button>
              ) : (
                <>
                  <Button size="lg" variant={justAdded ? "accent" : "primary"} className="flex-1" disabled={!canBuy} loading={pending} onClick={onAdd}>
                    {justAdded ? <><Check />{t("catalog.card.added")}</> : <><ShoppingCart />{t("catalog.pdp.addToCart")}</>}
                  </Button>
                  <Button asChild size="lg" variant="outline"><Link href={`/quote?sku=${encodeURIComponent(variant.sku)}&qty=${quantity}`}><FileText />{t("catalog.pdp.requestQuote")}</Link></Button>
                </>
              )}
              <AddToListButton variantId={variant.id} quantity={quantity} sku={variant.sku} size="lg" iconOnly className="sm:w-12 sm:px-0" />
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
            <li className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-accent" aria-hidden />{t("catalog.pdp.trust.securePayment")}</li>
            <li className="flex items-center gap-1.5"><Truck className="size-4 text-accent" aria-hidden />{t("catalog.pdp.trust.proDelivery")}</li>
            <li className="flex items-center gap-1.5"><Headset className="size-4 text-accent" aria-hidden />{t("catalog.pdp.trust.support")}</li>
            <li className="flex items-center gap-1.5"><FileText className="size-4 text-accent" aria-hidden />{t("catalog.pdp.trust.quote")}</li>
          </ul>

          {/* Barre sticky mobile */}
          {!price.requiresQuote && (
            <div className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-surface/95 px-4 py-2.5 backdrop-blur md:hidden">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-muted">{price.quantity} × {formatMoney(price.unitPrice)}</p>
                  <p className="t-price">{formatMoney(lineTotal)} <span className="text-xs font-medium text-muted">{t("common.labels.taxExcluded")}</span></p>
                </div>
                <Button size="lg" variant={justAdded ? "accent" : "primary"} disabled={!canBuy} loading={pending} onClick={onAdd} className="shrink-0">
                  {justAdded ? <Check /> : <ShoppingCart />}{t("catalog.pdp.stickyAdd")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Tableau des paliers : palier actif mis en évidence. */
export function TierTable({ rows, unit }: { rows: ReturnType<typeof buildTierTable>; unit: string }) {
  const t = useT();
  if (rows.length <= 1 && !rows.some((r) => r.requiresQuote)) return null;
  return (
    <div>
      <p className="t-label mb-2 text-muted">{t("catalog.pdp.tiersTitle")}</p>
      <table className="w-full overflow-hidden rounded-lg border border-border bg-surface text-sm">
        <thead className="bg-paper-2/70 text-xs text-muted">
          <tr>
            <th className="px-3 py-2 text-start font-semibold">{t("catalog.pdp.tiersQuantity")}</th>
            <th className="px-3 py-2 text-end font-semibold">{t("catalog.pdp.tiersUnitPrice", { unit })}</th>
            <th className="px-3 py-2 text-end font-semibold">{t("catalog.pdp.tiersSavings")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.minQuantity} className={cn("border-t border-border", r.isActive && "bg-accent-softer font-semibold")} aria-current={r.isActive ? "true" : undefined}>
              <td className="px-3 py-2 tnum">
                {r.maxQuantity === null ? t("catalog.pdp.tiersPlus", { min: r.minQuantity }) : t("catalog.pdp.tiersRange", { min: r.minQuantity, max: r.maxQuantity })}
                {r.isActive && <span className="ms-2 rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">{t("catalog.pdp.tiersActive")}</span>}
              </td>
              <td className="px-3 py-2 text-end tnum">{r.requiresQuote ? t("catalog.pdp.tiersQuote") : formatMoney(r.unitPrice)}</td>
              <td className={cn("px-3 py-2 text-end tnum", r.savingsPercent > 0 && "text-accent")}>{r.requiresQuote || r.savingsPercent === 0 ? "—" : `-${r.savingsPercent} %`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
