import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListChecks } from "lucide-react";
import { getT } from "@/i18n/server";
import { requireBusinessUser, getPricingContext } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { calculateUnitPrice } from "@/lib/pricing/engine";
import { buildPricingInput, getActivePromotions, getAvailability, variantPricingInclude } from "@/services/pricing";
import { AccountShell } from "@/components/account/account-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/commerce/product-image";
import { AvailabilityBadge } from "@/components/commerce/availability-badge";
import { ListHeaderActions, ListItemQuantity, RemoveListItem } from "@/components/account/list-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.lists.title"), robots: { index: false } };
}

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t, user, ctx] = await Promise.all([params, getT(), requireBusinessUser("/account/lists"), getPricingContext()]);
  const list = await db.shoppingList.findFirst({
    where: { id, businessId: user.business.id },
    include: { items: { orderBy: { addedAt: "desc" }, include: { variant: { include: { ...variantPricingInclude(ctx), product: { select: { id: true, slug: true, name: true, status: true, categoryId: true, brandId: true, requiresAccount: true, taxClass: { select: { rateBps: true } }, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true, alt: true } } } } } } } } },
  });
  if (!list) notFound();
  const promotions = await getActivePromotions();
  const rows = await Promise.all(list.items.map(async (item) => {
    const v = item.variant;
    const input = await buildPricingInput(v);
    const price = calculateUnitPrice(input, item.quantity, ctx, promotions);
    const availability = getAvailability(v);
    return { item, v, price, availability: { ...availability, restockAt: availability.restockAt?.toISOString() ?? null }, active: v.isActive && v.product.status === "ACTIVE" };
  }));
  const total = rows.reduce((s, r) => (r.active && !r.price.hidden ? s + r.price.unitPrice * r.price.quantity : s), 0);
  return (
    <AccountShell user={user} title={list.name} actions={<ListHeaderActions listId={list.id} name={list.name} description={list.description} isDefault={list.isDefault} itemCount={list.items.length} />}>
      {list.description && <p className="mb-4 text-sm text-muted">{list.description}</p>}
      {rows.length ? (
        <div className="rounded-lg border border-border bg-surface">
          <ul className="divide-y divide-border">
            {rows.map(({ item, v, price, availability, active }) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/p/${v.product.slug}`} className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-paper-2"><ProductImage src={v.product.images[0]?.url} alt="" sizes="64px" /></Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/p/${v.product.slug}`} className="line-clamp-1 text-sm font-medium hover:underline">{v.product.name}{v.name && <span className="text-muted"> — {v.name}</span>}</Link>
                  <p className="text-xs text-muted">{v.sku}{v.packagingLabel && ` · ${v.packagingLabel}`}</p>
                  {active ? <AvailabilityBadge availability={availability} /> : <span className="text-xs text-error">{t("common.errors.productUnavailable")}</span>}
                </div>
                <div className="hidden text-end text-sm sm:block">{price.hidden ? "—" : <><span className="font-semibold tnum">{formatMoney(price.unitPrice)}</span><span className="block text-xs text-muted">/ {v.unitLabel}</span></>}</div>
                <ListItemQuantity listId={list.id} variantId={v.id} quantity={item.quantity} moq={v.moq} step={v.orderMultiple} />
                <RemoveListItem listId={list.id} variantId={v.id} />
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm"><span className="text-muted">{t("common.labels.total")} {t("common.labels.taxExcluded")}</span><span className="font-semibold tnum">{formatMoney(total)}</span></div>
        </div>
      ) : (
        <EmptyState icon={<ListChecks />} title={t("account.lists.emptyList")} actions={<Button asChild><Link href="/c">{t("common.actions.seeProducts")}</Link></Button>} />
      )}
    </AccountShell>
  );
}
