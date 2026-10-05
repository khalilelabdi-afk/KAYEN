import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { ORDER_TRANSITIONS, formatAddress, type AddressSnapshot } from "@/services/orders";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard, DescriptionList } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { OrderStatusPanel, OrderShipmentForm, OrderNoteForm } from "@/components/admin/order-panels";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t] = await Promise.all([params, getT()]);
  const order = await db.order.findUnique({ where: { id }, include: { business: true, user: true, items: true, payments: { orderBy: { createdAt: "desc" } }, shipments: { orderBy: { createdAt: "desc" } }, statusHistory: { orderBy: { createdAt: "asc" }, include: { user: { select: { firstName: true, lastName: true } } } }, orderNotes: { orderBy: { createdAt: "asc" }, include: { user: { select: { firstName: true, lastName: true } } } }, invoice: true, quote: { select: { id: true, number: true } } } });
  if (!order) notFound();
  const billing = order.billingAddress as unknown as AddressSnapshot;
  const shipping = order.shippingAddress as unknown as AddressSnapshot;
  return (
    <AdminShell title={t("admin.orders.detail.title", { number: order.number })} breadcrumb={[{ label: t("admin.nav.orders"), href: "/admin/orders" }, { label: order.number }]} actions={<><StatusBadge status={order.status} label={t.enum("common.status.order", order.status)} className="text-sm" /><StatusBadge status={order.paymentStatus} label={t.enum("common.status.payment", order.paymentStatus)} className="text-sm" /></>}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <AdminCard title={t("admin.orders.detail.items")} className="[&>div]:p-0">
            <table className="w-full text-sm">
              <thead className="bg-paper-2/70 text-xs text-muted"><tr><th className="px-4 py-2 text-start font-semibold">SKU</th><th className="px-4 py-2 text-start font-semibold">{t("common.labels.name")}</th><th className="px-4 py-2 text-end font-semibold">{t("common.labels.quantity")}</th><th className="px-4 py-2 text-end font-semibold">{t("common.labels.unitPrice")}</th><th className="px-4 py-2 text-end font-semibold">{t("common.labels.total")} HT</th></tr></thead>
              <tbody>{order.items.map((i) => <tr key={i.id} className="border-t border-border"><td className="px-4 py-2 font-mono text-xs">{i.sku}</td><td className="px-4 py-2">{i.name}{i.variantName && <span className="text-muted"> — {i.variantName}</span>}</td><td className="px-4 py-2 text-end tnum">{i.quantity}</td><td className="px-4 py-2 text-end tnum">{formatMoney(i.unitPrice)}{i.baseUnitPrice !== i.unitPrice && <s className="ms-1 text-xs text-subtle">{formatMoney(i.baseUnitPrice)}</s>}</td><td className="px-4 py-2 text-end font-semibold tnum">{formatMoney(i.lineSubtotal - i.discountAmount)}</td></tr>)}</tbody>
            </table>
            <dl className="ms-auto w-72 space-y-1 p-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">{t("cart.summary.subtotal")}</dt><dd className="tnum">{formatMoney(order.subtotal)}</dd></div>
              {order.discountTotal > 0 && <div className="flex justify-between text-accent"><dt>{t("cart.summary.discount")}{order.couponCode && ` (${order.couponCode})`}</dt><dd className="tnum">-{formatMoney(order.discountTotal)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">{t("cart.summary.shipping")} · {order.shippingMethodName}</dt><dd className="tnum">{formatMoney(order.shippingTotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t("cart.summary.tax")}</dt><dd className="tnum">{formatMoney(order.taxTotal)}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 font-bold"><dt>{t("cart.summary.total")}</dt><dd className="tnum">{formatMoney(order.total)}</dd></div>
            </dl>
          </AdminCard>
          <AdminCard title={t("admin.orders.detail.shipment")}>
            {order.shipments.length > 0 && <ul className="mb-4 divide-y divide-border text-sm">{order.shipments.map((s) => <li key={s.id} className="flex justify-between py-2"><span>{s.carrier ?? "—"} · {s.trackingNumber ?? "—"}{s.trackingUrl && <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="ms-2 underline">↗</a>}</span><span className="text-xs text-muted">{s.shippedAt && formatDateTime(s.shippedAt)}</span></li>)}</ul>}
            {!["CANCELLED", "REFUNDED", "DELIVERED"].includes(order.status) && <OrderShipmentForm orderId={order.id} />}
          </AdminCard>
          <AdminCard title={t("admin.orders.detail.history")} className="[&>div]:p-0">
            <ul className="divide-y divide-border text-sm">{order.statusHistory.map((h) => <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-2"><span><StatusBadge status={h.toStatus} label={t.enum("common.status.order", h.toStatus)} />{h.note && <span className="ms-2 text-xs text-muted">{h.note}</span>}</span><span className="text-xs text-muted">{h.user ? `${h.user.firstName} ${h.user.lastName} · ` : ""}{formatDateTime(h.createdAt)}</span></li>)}</ul>
          </AdminCard>
          <AdminCard title={t("admin.orders.detail.notes")}>
            {order.orderNotes.length > 0 && <ul className="mb-4 space-y-2 text-sm">{order.orderNotes.map((n) => <li key={n.id} className="rounded-md bg-paper px-3 py-2"><p>{n.content}</p><p className="mt-1 text-xs text-muted">{n.user ? `${n.user.firstName} ${n.user.lastName} · ` : ""}{formatDateTime(n.createdAt)}</p></li>)}</ul>}
            <OrderNoteForm orderId={order.id} />
          </AdminCard>
        </div>
        <div className="space-y-6">
          <AdminCard title={t("admin.orders.detail.changeStatus")}><OrderStatusPanel orderId={order.id} status={order.status} transitions={ORDER_TRANSITIONS[order.status] ?? []} paymentStatus={order.paymentStatus} hasInvoice={!!order.invoice} /></AdminCard>
          <AdminCard title={t("admin.orders.detail.customer")}>
            <DescriptionList items={[
              { label: t("common.labels.company"), value: <Link href={`/admin/customers/${order.businessId}`} className="underline">{order.business.name}</Link> },
              { label: t("common.labels.email"), value: order.user?.email ?? order.business.email },
              { label: t("common.labels.phone"), value: order.user?.phone ?? order.business.phone },
              { label: t("admin.orders.detail.poReference"), value: order.poReference },
              { label: t("admin.orders.detail.payment"), value: `${t.enum("common.status.paymentMethod", order.paymentMethod)}${order.payments[0]?.providerRef ? ` · ${order.payments[0].providerRef}` : ""}` },
              { label: t("admin.orders.detail.invoice"), value: order.invoice ? <Link href={`/account/invoices/${order.invoice.id}`} className="underline">{order.invoice.number}</Link> : null },
              { label: t("admin.nav.quotes"), value: order.quote ? <Link href={`/admin/quotes/${order.quote.id}`} className="underline">{order.quote.number}</Link> : null },
            ]} />
          </AdminCard>
          <AdminCard title={t("admin.orders.detail.addresses")}>
            <p className="t-label text-muted">{t("checkout.information.shippingAddress")}</p><p className="mt-1 text-sm">{formatAddress(shipping)}</p>
            {order.deliveryInstructions && <p className="mt-1 text-xs text-muted">{t("admin.orders.detail.deliveryInstructions")} : {order.deliveryInstructions}</p>}
            <p className="t-label mt-4 text-muted">{t("checkout.information.billingAddress")}</p><p className="mt-1 text-sm">{formatAddress(billing)}</p>
            {order.notes && <><p className="t-label mt-4 text-muted">{t("admin.orders.detail.customerNotes")}</p><p className="mt-1 text-sm">{order.notes}</p></>}
          </AdminCard>
        </div>
      </div>
    </AdminShell>
  );
}
