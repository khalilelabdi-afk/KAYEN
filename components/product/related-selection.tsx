"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useT } from "@/i18n/client";
import { formatMoney } from "@/lib/money";
import type { ProductCardData } from "@/types/catalog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/commerce/product-image";
import { useToast } from "@/components/ui/toast";
import { addManyToCartAction } from "@/app/actions/cart";

/** "Souvent achetés ensemble" : sélection multiple + ajout groupé au panier. */
export function RelatedSelection({ products, title }: { products: ProductCardData[]; title: string }) {
  const t = useT();
  const toast = useToast();
  const buyable = products.filter((p) => !p.price.hidden && !p.price.requiresQuote && p.availability.status !== "out_of_stock" && !p.hasVariants);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set(buyable.map((p) => p.id)));
  const [pending, start] = React.useTransition();
  if (!products.length) return null;
  const chosen = buyable.filter((p) => selected.has(p.id));
  const total = chosen.reduce((s, p) => s + p.price.unitPrice * p.moq, 0);

  const addAll = () =>
    start(async () => {
      const res = await addManyToCartAction({ items: chosen.map((p) => ({ variantId: p.variantId, quantity: p.moq })) });
      if (res.ok) toast.success(res.message ?? t("common.toasts.addedToCart"), { action: { label: t("cart.drawer.viewCart"), href: "/cart" } });
      else toast.error(res.error);
    });

  return (
    <div className="rounded-lg border border-border bg-surface p-4 md:p-5">
      <h2 className="t-h3">{title}</h2>
      <ul className="mt-4 divide-y divide-border">
        {products.map((p) => {
          const can = buyable.some((b) => b.id === p.id);
          return (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <Checkbox id={`rel-${p.id}`} checked={selected.has(p.id)} disabled={!can} onCheckedChange={(c) => setSelected((s) => { const n = new Set(s); if (c) n.add(p.id); else n.delete(p.id); return n; })} />
              <Link href={p.href} className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-paper-2">
                <ProductImage src={p.image?.url} alt={p.image?.alt ?? p.name} sizes="56px" />
              </Link>
              <label htmlFor={`rel-${p.id}`} className="min-w-0 flex-1 cursor-pointer">
                <span className="line-clamp-2 text-sm font-medium">{p.name}</span>
                <span className="block text-xs text-muted">{p.packagingLabel ?? p.unitLabel} · {t("catalog.card.minimumShort", { count: p.moq })}</span>
              </label>
              <span className="shrink-0 text-sm font-semibold tnum">{p.price.hidden ? "—" : `${formatMoney(p.price.unitPrice * p.moq)}`}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted">{t("catalog.pdp.related.selectionTotal", { total: `${formatMoney(total)} ${t("common.labels.taxExcluded")}` })}</p>
        <Button onClick={addAll} loading={pending} disabled={!chosen.length}><Plus />{t("catalog.pdp.related.addSelection")}</Button>
      </div>
    </div>
  );
}
