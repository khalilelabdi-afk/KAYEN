import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard, DescriptionList, StatCard } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { BusinessStatusButtons, BusinessPricingForm, CustomerPrices } from "@/components/admin/customer-panels";

export default async function AdminCustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t, groups] = await Promise.all([params, getT(), db.customerGroup.findMany({ orderBy: { name: "asc" } })]);
  const b = await db.business.findUnique({ where: { id }, include: { customerGroup: true, sector: true, members: { include: { user: true }, orderBy: { createdAt: "asc" } }, addresses: true, orders: { orderBy: { placedAt: "desc" }, take: 20 }, quotes: { orderBy: { createdAt: "desc" }, take: 10 }, customerPrices: { include: { variant: { include: { product: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } } } });
  if (!b) notFound();
  const valid = b.orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status));
  const revenue = valid.reduce((s, o) => s + o.subtotal - o.discountTotal, 0);
  return (
    <AdminShell title={b.name} breadcrumb={[{ label: t("admin.nav.customers"), href: "/admin/customers" }, { label: b.name }]} actions={<><StatusBadge status={b.status} label={t.enum("common.status.business", b.status)} className="text-sm" /><BusinessStatusButtons businessId={b.id} status={b.status} /></>}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("admin.customers.detail.revenue")} value={formatMoney(revenue)} />
        <StatCard label={t("admin.customers.detail.orderCount")} value={String(valid.length)} />
        <StatCard label={t("admin.customers.detail.avgOrder")} value={formatMoney(valid.length ? Math.round(revenue / valid.length) : 0)} />
        <StatCard label={t("admin.customers.detail.since")} value={formatDate(b.createdAt)} hint={valid[0] ? `${t("admin.customers.detail.lastOrder")} : ${formatDate(valid[0].placedAt)}` : undefined} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <AdminCard title={t("admin.customers.detail.info")}>
            <DescriptionList items={[{ label: t("common.labels.legalName"), value: b.legalName }, { label: t("common.labels.taxId"), value: b.taxId }, { label: t("account.company.registrationNumber"), value: b.registrationNumber }, { label: t("common.labels.activity"), value: b.sector?.name ?? b.activityLabel }, { label: t("common.labels.email"), value: b.email }, { label: t("common.labels.phone"), value: b.phone }, { label: t("common.labels.website"), value: b.website }]} />
          </AdminCard>
          <AdminCard title={t("admin.customers.detail.members")} className="[&>div]:p-0">
            <ul className="divide-y divide-border text-sm">{b.members.map((m) => <li key={m.id} className="flex items-center justify-between px-4 py-2"><span>{m.user.firstName} {m.user.lastName}<span className="block text-xs text-muted">{m.user.email}{m.user.lastLoginAt && ` · ${formatDateTime(m.user.lastLoginAt)}`}</span></span><span className="text-xs">{t.enum("common.status.businessRole", m.role)}</span></li>)}</ul>
          </AdminCard>
          <AdminCard title={t("admin.customers.detail.addresses")} className="[&>div]:p-0">
            <ul className="divide-y divide-border text-sm">{b.addresses.map((a) => <li key={a.id} className="px-4 py-2">{a.label && <span className="font-medium">{a.label} · </span>}{a.company && `${a.company}, `}{a.line1}, {a.postalCode} {a.city}, {a.countryCode}</li>)}{!b.addresses.length && <li className="px-4 py-3 text-muted">{t("admin.common.noData")}</li>}</ul>
          </AdminCard>
          <AdminCard title={t("admin.customers.detail.orders")} className="[&>div]:p-0">
            <ul className="divide-y divide-border text-sm">{b.orders.map((o) => <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between px-4 py-2 hover:bg-paper"><span className="font-semibold">{o.number}<span className="ms-2 text-xs font-normal text-muted">{formatDate(o.placedAt)}</span></span><span className="flex items-center gap-3"><StatusBadge status={o.status} label={t.enum("common.status.order", o.status)} /><span className="font-semibold tnum">{formatMoney(o.total)}</span></span></Link></li>)}{!b.orders.length && <li className="px-4 py-3 text-muted">{t("admin.common.noData")}</li>}</ul>
          </AdminCard>
          <AdminCard title={t("admin.customers.detail.quotes")} className="[&>div]:p-0">
            <ul className="divide-y divide-border text-sm">{b.quotes.map((q) => <li key={q.id}><Link href={`/admin/quotes/${q.id}`} className="flex items-center justify-between px-4 py-2 hover:bg-paper"><span className="font-semibold">{q.number}<span className="ms-2 text-xs font-normal text-muted">{formatDate(q.createdAt)}</span></span><StatusBadge status={q.status} label={t.enum("common.status.quote", q.status)} /></Link></li>)}{!b.quotes.length && <li className="px-4 py-3 text-muted">{t("admin.common.noData")}</li>}</ul>
          </AdminCard>
        </div>
        <div className="space-y-6">
          <AdminCard title={t("admin.customers.detail.pricing")}><BusinessPricingForm businessId={b.id} groups={groups.map((g) => ({ id: g.id, name: `${g.name} (-${g.discountBps / 100} %)` }))} customerGroupId={b.customerGroupId} allowInvoicePay={b.allowInvoicePay} invoiceTermDays={b.invoiceTermDays} creditLimit={b.creditLimit} internalNotes={b.internalNotes} /></AdminCard>
          <AdminCard title={t("admin.customers.detail.customerPrices")}><CustomerPrices businessId={b.id} prices={b.customerPrices.map((p) => ({ id: p.id, sku: p.variant.sku, name: p.variant.product.name, minQuantity: p.minQuantity, unitPrice: p.unitPrice, basePrice: p.variant.basePrice }))} /></AdminCard>
        </div>
      </div>
    </AdminShell>
  );
}
