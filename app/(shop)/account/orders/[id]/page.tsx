import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RotateCcw, Download, ExternalLink } from "lucide-react";
import { getT } from "@/i18n/server";
import { requireBusinessUser } from "@/lib/auth/dal";
import { getBusinessOrder, formatAddress, type AddressSnapshot } from "@/services/orders";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { AccountShell } from "@/components/account/account-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/commerce/product-image";
import { ReorderButton } from "@/components/account/reorder-button";
import { CancelOrderButton } from "@/components/account/order-actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const t = await getT();
  const { id } = await params;
  return { title: `${t("account.orders.title")} ${id.slice(0, 8)}`, robots: { index: false } };
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t, user] = await Promise.all([params, getT(), requireBusinessUser("/account/orders")]);
  const order = await getBusinessOrder(user.business.id, id);
  if (!order) notFound();
  const billing = order.billingAddress as unknown as AddressSnapshot;
  const shipping = order.shippingAddress as unknown as AddressSnapshot;
  const cancellable = ["PENDING", "CONFIRMED"].includes(order.status);
  return (
    <AccountShell user={user} title={t("account.orders.detail.title", { number: order.number })} actions={<div className="flex flex-wrap gap-2"><ReorderButton orderId={order.id} label={t("account.orders.detail.reorder")} icon={<RotateCcw />} />{cancellable && <CancelOrderButton orderId={order.id} />}</div>}>
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted">
        <span>{t("account.orders.detail.placedOn", { date: formatDateTime(order.placedAt) })}</span>
        <StatusBadge status={order.status} label={t.enum("common.status.order", order.status)} />
        <StatusBadge status={order.paymentStatus} label={`${t("account.orders.detail.payment")} : ${t.enum("common.status.payment", order.paymentStatus)}`} />
        {order.poReference && <span>{t("account.orders.detail.poReference", { ref: order.poReference })}</span>}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-surface">
            <h2 className="t-h4 border-b border-border px-4 py-3">{t("account.orders.detail.items")}</h2>
            <ul className="divide-y divide-border">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-paper-2"><ProductImage src={it.imageUrl} alt="" sizes="56px" /></span>
                  <span className="min-w-0 flex-1">
                    {it.product && it.product.status === "ACTIVE" ? <Link href={`/p/${it.product.slug}`} className="line-clamp-1 font-medium hover:underline">{it.name}</Link> : <span className="line-clamp-1 font-medium">{it.name}</span>}
                    <span className="block text-xs text-muted">{it.sku}{it.variantName && ` · ${it.variantName}`}{it.packagingLabel && ` · ${it.packagingLabel}`}</span>
                    <span className="block text-xs text-muted">{it.quantity} × {formatMoney(it.unitPrice)} {t("common.labels.taxExcluded")}{it.baseUnitPrice > it.unitPrice && <s className="ms-1 text-subtle">{formatMoney(it.baseUnitPrice)}</s>}</span>
                  </span>
                  <span className="font-semibold tnum">{formatMoney(it.lineSubtotal - it.discountAmount)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-border bg-surface">
            <h2 className="t-h4 border-b border-border px-4 py-3">{t("account.orders.detail.timeline")}</h2>
            <ol className="divide-y divide-border">
              {order.statusHistory.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"><span><StatusBadge status={h.toStatus} label={t.enum("common.status.order", h.toStatus)} />{h.note && <span className="ms-2 text-xs text-muted">{h.note}</span>}</span><span className="text-xs text-muted">{formatDateTime(h.createdAt)}</span></li>
              ))}
            </ol>
          </section>
          {order.shipments.length > 0 && (
            <section className="rounded-lg border border-border bg-surface">
              <h2 className="t-h4 border-b border-border px-4 py-3">{t("account.orders.detail.tracking")}</h2>
              <ul className="divide-y divide-border">
                {order.shipments.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span>{s.carrier && <span className="font-medium">{s.carrier} · </span>}{s.trackingNumber ? t("account.orders.detail.trackingNumber", { number: s.trackingNumber }) : t.enum("common.status.shipment", s.status)}{s.shippedAt && <span className="block text-xs text-muted">{formatDate(s.shippedAt)}</span>}</span>{s.trackingUrl && <Button asChild size="sm" variant="outline"><a href={s.trackingUrl} target="_blank" rel="noopener noreferrer"><ExternalLink />{t("account.orders.detail.trackPackage")}</a></Button>}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="t-h4 mb-3">{t("account.orders.detail.summary")}</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">{t("cart.summary.subtotal")}</dt><dd className="tnum">{formatMoney(order.subtotal)}</dd></div>
              {order.discountTotal > 0 && <div className="flex justify-between text-accent"><dt>{t("cart.summary.discount")}{order.couponCode && ` (${order.couponCode})`}</dt><dd className="tnum">-{formatMoney(order.discountTotal)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">{t("cart.summary.shipping")} · {order.shippingMethodName}</dt><dd className="tnum">{order.shippingTotal ? formatMoney(order.shippingTotal) : t("cart.summary.shippingFree")}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t("cart.summary.tax")}</dt><dd className="tnum">{formatMoney(order.taxTotal)}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold"><dt>{t("cart.summary.total")}</dt><dd className="t-price">{formatMoney(order.total)}</dd></div>
              {order.savingsTotal > 0 && <p className="text-xs text-accent">{t("cart.summary.savings")} : {formatMoney(order.savingsTotal)}</p>}
            </dl>
          </section>
          <section className="rounded-lg border border-border bg-surface p-4 text-sm">
            <h2 className="t-h4 mb-2">{t("account.orders.detail.payment")}</h2>
            <p>{t.enum("common.status.paymentMethod", order.paymentMethod)}</p>
            <p className="text-xs text-muted">{t.enum("common.status.payment", order.paymentStatus)}</p>
            {order.invoice && <div className="mt-3 flex items-center justify-between rounded-md bg-paper px-3 py-2 text-xs"><span>{t("account.orders.detail.invoice")} {order.invoice.number}</span><Link href={`/account/invoices/${order.invoice.id}`} className="inline-flex items-center gap-1 font-medium underline"><Download className="size-3.5" />{t("account.orders.detail.downloadInvoice")}</Link></div>}
          </section>
          <section className="rounded-lg border border-border bg-surface p-4 text-sm">
            <h2 className="t-h4 mb-2">{t("account.orders.detail.shipping")}</h2>
            <p>{formatAddress(shipping)}</p>
            {order.deliveryInstructions && <p className="mt-1 text-xs text-muted">{order.deliveryInstructions}</p>}
            <h2 className="t-h4 mb-2 mt-4">{t("account.orders.detail.billing")}</h2>
            <p>{formatAddress(billing)}</p>
          </section>
          <div className="rounded-lg border border-border bg-paper p-4 text-sm"><p className="font-medium">{t("account.orders.detail.help")}</p><Link href={`/contact?subject=order`} className="mt-1 inline-block text-xs underline">{t("account.orders.detail.contact")}</Link></div>
        </div>
      </div>
    </AccountShell>
  );
}
