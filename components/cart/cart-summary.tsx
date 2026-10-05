"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FileText, Tag, X, ShieldCheck } from "lucide-react";
import { useT } from "@/i18n/client";
import { formatMoney } from "@/lib/money";
import type { CartTotals } from "@/lib/pricing/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { applyCouponAction, removeCouponAction } from "@/app/actions/cart";

export interface CartSummaryProps {
  totals: CartTotals;
  couponCode: string | null;
  couponError: string | null;
  canCheckout: boolean;
  checkoutBlockedReason: string | null;
  checkoutHref: string;
  minimumOrderAmount: number;
  showCoupon?: boolean;
  compact?: boolean;
  quoteHref?: string;
  itemCount: number;
}

/** Récapitulatif partagé panier / checkout. */
export function CartSummary(p: CartSummaryProps) {
  const t = useT();
  const toast = useToast();
  const [code, setCode] = React.useState("");
  const [pending, start] = React.useTransition();
  const { totals } = p;
  const belowMinimum = p.minimumOrderAmount > 0 && totals.subtotal - totals.discountTotal < p.minimumOrderAmount;

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    start(async () => {
      const res = await applyCouponAction({ code });
      if (res.ok) { toast.success(res.message ?? ""); setCode(""); } else toast.error(res.error);
    });
  };
  const remove = () => start(async () => { await removeCouponAction(); });

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="t-h4">{p.compact ? t("checkout.review.title") : t("cart.summary.title")}</h2>
        <p className="text-xs text-muted">{t.plural("cart.summary.itemsCount", p.itemCount)}</p>
      </div>
      <dl className="space-y-2 px-5 py-4 text-sm">
        <div className="flex justify-between"><dt className="text-muted">{t("cart.summary.subtotal")}</dt><dd className="font-medium tnum">{formatMoney(totals.subtotal)}</dd></div>
        {totals.savingsTotal - totals.discountTotal > 0 && <div className="flex justify-between text-accent"><dt>{t("cart.summary.savings")}</dt><dd className="tnum">-{formatMoney(totals.savingsTotal - totals.discountTotal)}</dd></div>}
        {totals.discounts.map((d) => (
          <div key={d.promotionId} className="flex justify-between text-accent">
            <dt className="flex items-center gap-1.5">
              {d.isCoupon ? <Tag className="size-3.5" aria-hidden /> : null}{d.name}{d.code && ` (${d.code})`}
              {d.isCoupon && <button type="button" onClick={remove} className="ms-1 rounded p-0.5 text-muted hover:text-error" aria-label={t("cart.summary.couponRemove")}><X className="size-3" /></button>}
            </dt>
            <dd className="tnum">-{formatMoney(d.amount)}</dd>
          </div>
        ))}
        <div className="flex justify-between">
          <dt className="text-muted">{t("cart.summary.shipping")}</dt>
          <dd className="tnum">{totals.shippingIsFree ? <span className="font-medium text-accent">{t("cart.summary.shippingFree")}</span> : totals.shippingTotal > 0 ? formatMoney(totals.shippingTotal) : <span className="text-xs text-muted">{t("cart.summary.shippingEstimated")}</span>}</dd>
        </div>
        {totals.freeShippingRemaining !== null && (
          <div className="rounded-md bg-paper px-3 py-2 text-xs">
            {totals.freeShippingRemaining > 0 ? <span className="text-muted">{t("cart.summary.freeShippingRemaining", { amount: formatMoney(totals.freeShippingRemaining) })}</span> : <span className="font-medium text-accent">{t("cart.summary.freeShippingReached")}</span>}
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2"><dt className="text-muted">{t("cart.summary.totalHt")}</dt><dd className="font-medium tnum">{formatMoney(totals.subtotal - totals.discountTotal + totals.shippingTotal)}</dd></div>
        {totals.taxBreakdown.map((tx) => (
          <div key={tx.rateBps} className="flex justify-between"><dt className="text-muted">{t("cart.summary.taxRate", { rate: `${(tx.rateBps / 100).toLocaleString("fr-FR")} %` })}</dt><dd className="tnum">{formatMoney(tx.amount)}</dd></div>
        ))}
        <div className="flex items-baseline justify-between border-t border-border pt-3"><dt className="font-semibold">{t("cart.summary.total")}</dt><dd className="t-price-lg">{formatMoney(totals.total)}</dd></div>
      </dl>

      {p.showCoupon !== false && !p.couponCode && (
        <form onSubmit={apply} className="flex gap-2 border-t border-border px-5 py-3">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t("cart.summary.couponPlaceholder")} aria-label={t("cart.summary.coupon")} className="h-9 text-sm uppercase" />
          <Button type="submit" size="sm" variant="secondary" loading={pending} disabled={!code.trim()}>{t("cart.summary.couponApply")}</Button>
        </form>
      )}
      {p.couponCode && p.couponError && <p className="px-5 pb-2 text-xs text-error">{t("cart.summary.couponInvalid")} <button type="button" onClick={remove} className="underline">{t("cart.summary.couponRemove")}</button></p>}

      {!p.compact && (
        <div className="space-y-2 border-t border-border px-5 py-4">
          {belowMinimum && <p className="text-xs text-warning">{t("cart.summary.minimumOrder", { amount: formatMoney(p.minimumOrderAmount) })}</p>}
          {p.checkoutBlockedReason && <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">{p.checkoutBlockedReason}</p>}
          <Button asChild size="lg" fullWidth disabled={!p.canCheckout || belowMinimum} aria-disabled={!p.canCheckout || belowMinimum}>
            <Link href={p.canCheckout && !belowMinimum ? p.checkoutHref : "#"} onClick={(e) => { if (!p.canCheckout || belowMinimum) e.preventDefault(); }}>{t("cart.summary.checkout")}<ArrowRight className="rtl:rotate-180" /></Link>
          </Button>
          {p.quoteHref && <Button asChild variant="outline" fullWidth><Link href={p.quoteHref}><FileText />{t("cart.summary.requestQuote")}</Link></Button>}
          <p className="flex items-start gap-1.5 pt-1 text-[11px] text-muted"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />{t("cart.summary.secure")}</p>
        </div>
      )}
    </div>
  );
}
