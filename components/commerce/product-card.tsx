"use client";

import * as React from "react";
import Link from "next/link";
import { Check, FileText } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import type { ProductCardData } from "@/types/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { ProductImage } from "./product-image";
import { AvailabilityBadge } from "./availability-badge";
import { useAddToCart } from "./use-add-to-cart";
import { track } from "@/lib/analytics";

export interface ProductCardProps {
  product: ProductCardData;
  priority?: boolean;
  listId?: string;
  className?: string;
  /** "grid" (par défaut) ou "row" (liste compacte, mobile). */
  layout?: "grid" | "row";
}

/** Carte produit réutilisable : visuel, marque, nom, conditionnement, disponibilité, prix, paliers, ajout rapide. */
export function ProductCard({ product, priority = false, listId, className, layout = "grid" }: ProductCardProps) {
  const t = useT();
  const [quantity, setQuantity] = React.useState(product.moq);
  const { add, pending, justAdded } = useAddToCart();
  const p = product.price;
  const canBuy = !p.hidden && product.availability.status !== "out_of_stock" && !p.requiresQuote;
  const unit = t("catalog.card.perUnit", { unit: product.unitLabel });

  const onSelect = () => track({ name: "select_item", params: { item_id: product.sku, item_name: product.name, item_list_id: listId } });

  const badges = (
    <div className="pointer-events-none absolute start-2 top-2 z-10 flex flex-col items-start gap-1">
      {p.promotionBadge && <Badge variant="promo">{p.promotionBadge}</Badge>}
      {!p.promotionBadge && p.compareAtUnitPrice && p.savingsPercent > 0 && <Badge variant="promo">{t("catalog.card.savings", { percent: p.savingsPercent })}</Badge>}
      {product.badges.isClearance && <Badge variant="default">{t("catalog.card.clearance")}</Badge>}
      {product.badges.isNew && <Badge variant="outline">{t("catalog.card.new")}</Badge>}
      {product.badges.isBestseller && !product.badges.isNew && <Badge variant="soft">{t("catalog.card.bestseller")}</Badge>}
    </div>
  );

  const price = p.hidden ? (
    <Link href={`/login?next=${encodeURIComponent(product.href)}`} className="text-sm font-medium text-accent underline underline-offset-2">
      {t("catalog.card.loginForPrice")}
    </Link>
  ) : (
    <div>
      {(p.hasTiers || product.hasVariants) && <p className="text-[11px] text-muted">{t("catalog.card.from")}</p>}
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span className={cn("t-price", p.source === "promotion" && "text-promo")}>
          {formatMoney(p.hasTiers || product.hasVariants ? p.lowestUnitPrice : p.unitPrice)}
          <span className="ms-1 text-xs font-medium text-muted">{t("common.labels.taxExcluded")}</span>
        </span>
        {p.compareAtUnitPrice && <s className="text-xs text-subtle tnum">{formatMoney(p.compareAtUnitPrice)}</s>}
        <span className="text-xs text-muted">{unit}</span>
      </p>
      <p className="mt-0.5 text-[11px] text-muted">
        {t("catalog.card.minimum", { count: product.moq, unit: product.moq > 1 ? `${product.unitLabel}s` : product.unitLabel })}
        {p.nextTier && (
          <>
            {" · "}
            <span className="font-semibold text-accent">{t("catalog.card.tierHint", { percent: p.nextTier.savingsPercent, quantity: p.nextTier.minQuantity, unit: `${product.unitLabel}s` })}</span>
          </>
        )}
      </p>
    </div>
  );

  const cta = p.hidden ? null : p.requiresQuote ? (
    <Button asChild variant="outline" size="sm" fullWidth>
      <Link href={`/quote?sku=${encodeURIComponent(product.sku)}&qty=${quantity}`}>
        <FileText /> {t("common.actions.requestQuote")}
      </Link>
    </Button>
  ) : product.hasVariants ? (
    <Button asChild variant="secondary" size="sm" fullWidth>
      <Link href={product.href} onClick={onSelect}>{t("catalog.pdp.selectVariant")}</Link>
    </Button>
  ) : (
    <div className="flex items-center gap-1.5">
      <QuantitySelector
        value={quantity}
        onChange={setQuantity}
        moq={product.moq}
        step={product.orderMultiple}
        size="sm"
        disabled={!canBuy}
        labels={{ decrease: t("catalog.card.decrease"), increase: t("catalog.card.increase"), quantity: t("catalog.card.quantityLabel", { name: product.name }) }}
        className="shrink-0"
      />
      <Button
        size="sm"
        variant={justAdded ? "accent" : "primary"}
        className="min-w-0 flex-1"
        disabled={!canBuy}
        loading={pending}
        onClick={() => add({ variantId: product.variantId, quantity, name: product.name, unitPrice: p.unitPrice, sku: product.sku })}
        aria-label={`${t("catalog.card.add")} — ${product.name}`}
      >
        {justAdded ? (<><Check /> {t("catalog.card.added")}</>) : t("catalog.card.add")}
      </Button>
    </div>
  );

  if (layout === "row") {
    return (
      <article className={cn("flex gap-3 rounded-lg border border-border bg-surface p-3", className)}>
        <Link href={product.href} onClick={onSelect} className="relative size-24 shrink-0 overflow-hidden rounded-md border border-border bg-paper-2 sm:size-32">
          {badges}
          <ProductImage src={product.image?.url} alt={product.image?.alt ?? product.name} sizes="128px" priority={priority} />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          {product.brand && <p className="t-label truncate text-muted">{product.brand.name}</p>}
          <Link href={product.href} onClick={onSelect} className="line-clamp-2 text-sm font-medium hover:underline">{product.name}</Link>
          <p className="mt-0.5 text-xs text-muted">{[product.packagingLabel, `${t("common.labels.sku")} ${product.sku}`].filter(Boolean).join(" · ")}</p>
          <AvailabilityBadge availability={product.availability} className="mt-1" />
          <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
            {price}
            <div className="w-full sm:w-auto sm:min-w-56">{cta}</div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group flex flex-col rounded-lg border border-border bg-surface transition-shadow hover:shadow-md", className)}>
      <Link href={product.href} onClick={onSelect} className="relative block aspect-square overflow-hidden rounded-t-lg border-b border-border bg-paper-2">
        {badges}
        <ProductImage src={product.image?.url} alt={product.image?.alt ?? product.name} priority={priority} className="transition-transform duration-300 group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.brand ? <p className="t-label truncate text-muted">{product.brand.name}</p> : <p className="t-label text-transparent">·</p>}
        <Link href={product.href} onClick={onSelect} className="line-clamp-2 min-h-10 text-sm font-medium leading-5 hover:underline">
          {product.name}
        </Link>
        <p className="truncate text-xs text-muted">{[product.packagingLabel, `${t("common.labels.sku")} ${product.sku}`].filter(Boolean).join(" · ")}</p>
        <AvailabilityBadge availability={product.availability} />
        <div className="mt-1 min-h-[3.25rem]">{price}</div>
        <div className="mt-auto pt-2">{cta}</div>
      </div>
    </article>
  );
}
