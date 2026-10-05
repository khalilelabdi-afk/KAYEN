"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import type { CartLineView } from "@/services/cart";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { ProductImage } from "@/components/commerce/product-image";
import { AddToListButton } from "@/components/commerce/add-to-list-button";
import { useToast } from "@/components/ui/toast";
import { updateCartItemAction, removeCartItemAction } from "@/app/actions/cart";
import { track } from "@/lib/analytics";

export function CartLine({ line, showListButton }: { line: CartLineView; showListButton: boolean }) {
  const t = useT();
  const toast = useToast();
  const [quantity, setQuantity] = React.useState(line.quantity);
  const [lastQuantity, setLastQuantity] = React.useState(line.quantity);
  const [pending, start] = React.useTransition();
  if (line.quantity !== lastQuantity) {
    setLastQuantity(line.quantity);
    setQuantity(line.quantity);
  }

  const update = (q: number) => {
    setQuantity(q);
    start(async () => {
      const res = await updateCartItemAction({ itemId: line.itemId, quantity: q });
      if (!res.ok) {
        toast.error(res.error);
        setQuantity(line.quantity);
      }
    });
  };
  const remove = () =>
    start(async () => {
      const res = await removeCartItemAction({ itemId: line.itemId });
      if (res.ok) {
        track({ name: "remove_from_cart", params: { item_id: line.sku, quantity: line.quantity } });
        toast.info(res.message ?? t("common.toasts.removedFromCart"));
      } else toast.error(res.error);
    });

  return (
    <li className={cn("flex gap-3 py-4 sm:gap-4", pending && "opacity-60", line.unavailable && "bg-error-soft/40")}>
      <Link href={line.href} className="relative size-20 shrink-0 overflow-hidden rounded-md border border-border bg-paper-2 sm:size-24">
        <ProductImage src={line.image?.url} alt={line.image?.alt ?? line.name} sizes="96px" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {line.brandName && <p className="t-label truncate text-muted">{line.brandName}</p>}
            <Link href={line.href} className="line-clamp-2 text-sm font-medium hover:underline">{line.name}{line.variantName && <span className="text-muted"> — {line.variantName}</span>}</Link>
            <p className="mt-0.5 text-xs text-muted">{[t("cart.item.sku", { sku: line.sku }), line.packagingLabel].filter(Boolean).join(" · ")}</p>
          </div>
          <p className="shrink-0 text-end">
            <span className="t-price">{formatMoney(line.lineSubtotal)}</span>
            <span className="block text-[11px] text-muted">{t("common.labels.taxExcluded")}</span>
          </p>
        </div>

        {line.unavailable ? (
          <p className="mt-2 text-xs font-medium text-error">{t("cart.item.unavailable")}</p>
        ) : (
          <>
            <p className="mt-1 text-xs text-muted">
              {line.unit.activeTier ? t("cart.item.unitPriceWithTier", { price: formatMoney(line.unit.unitPrice), unit: line.unitLabel, min: line.unit.activeTier.minQuantity }) : t("cart.item.unitPrice", { price: formatMoney(line.unit.unitPrice), unit: line.unitLabel })}
              {line.unit.savingsPercent > 0 && <span className="ms-2 text-accent">-{line.unit.savingsPercent} %</span>}
            </p>
            {line.priceChanged && <p className="mt-1 text-xs font-medium text-warning">{t("cart.item.priceChanged", { old: formatMoney(line.priceChanged.old), new: formatMoney(line.priceChanged.new) })}</p>}
            {line.availability.status === "out_of_stock" && <p className="mt-1 text-xs font-medium text-error">{t("common.availability.outOfStock")}</p>}
            {line.availability.status === "low_stock" && !line.availability.allowBackorder && line.quantity > line.availability.available && <p className="mt-1 text-xs font-medium text-warning">{t("cart.item.lowStock", { count: line.availability.available })}</p>}
            {line.requiresQuote && <p className="mt-1 text-xs font-medium text-warning">{t("cart.item.quoteRequired")}</p>}
          </>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!line.unavailable && (
            <QuantitySelector value={quantity} onChange={update} moq={line.moq} step={line.orderMultiple} max={line.availability.allowBackorder ? undefined : line.availability.available} size="sm" disabled={pending} labels={{ decrease: t("catalog.card.decrease"), increase: t("catalog.card.increase"), quantity: t("cart.item.quantity") }} />
          )}
          <span className="text-[11px] text-muted">{t("cart.item.moq", { count: line.moq })}{line.orderMultiple > 1 && ` · ${t("cart.item.multiple", { step: line.orderMultiple })}`}</span>
          <div className="ms-auto flex items-center gap-1">
            {showListButton && !line.unavailable && <AddToListButton variantId={line.variantId} quantity={line.quantity} sku={line.sku} variant="ghost" size="sm" iconOnly />}
            <button type="button" onClick={remove} disabled={pending} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted hover:bg-paper-2 hover:text-error" aria-label={`${t("cart.item.remove")} — ${line.name}`}>
              <Trash2 className="size-4" aria-hidden />
              <span className="hidden sm:inline">{t("cart.item.remove")}</span>
            </button>
          </div>
        </div>
        {line.nextTier && !line.unavailable && (
          <p className="mt-2 rounded-md bg-accent-softer px-2.5 py-1.5 text-xs font-medium text-accent">{t("cart.item.nextTier", { count: line.nextTier.quantityToAdd, unit: line.unitLabel + (line.nextTier.quantityToAdd > 1 ? "s" : ""), percent: line.nextTier.savingsPercent })}</p>
        )}
      </div>
    </li>
  );
}
