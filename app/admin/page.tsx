import Link from "next/link";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatCard, AdminCard } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { PeriodSelect } from "@/components/admin/period-select";

const PERIODS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, year: 365 };

function periodRange(days: number) {
  const since = new Date(Date.now() - days * 86_400_000);
  return { since, previousSince: new Date(since.getTime() - days * 86_400_000) };
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const period = sp.period && PERIODS[sp.period] ? sp.period : "30d";
  const { since, previousSince } = periodRange(PERIODS[period]);
  const validStatus = { notIn: ["CANCELLED", "REFUNDED"] as ("CANCELLED" | "REFUNDED")[] };
  const [current, previous, newCustomers, pendingQuotes, pendingBusinesses, lowStock, bestsellers, recentOrders, recentQuotes] = await Promise.all([
    db.order.aggregate({ where: { placedAt: { gte: since }, status: validStatus }, _count: { _all: true }, _sum: { subtotal: true, discountTotal: true } }),
    db.order.aggregate({ where: { placedAt: { gte: previousSince, lt: since }, status: validStatus }, _count: { _all: true }, _sum: { subtotal: true, discountTotal: true } }),
    db.business.count({ where: { createdAt: { gte: since } } }),
    db.quote.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
    db.business.count({ where: { status: "PENDING" } }),
    db.$queryRaw<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM "Inventory" i WHERE i.quantity - i.reserved <= i."lowStockThreshold"`,
    db.orderItem.groupBy({ by: ["productId", "name"], where: { order: { placedAt: { gte: since }, status: validStatus }, productId: { not: null } }, _sum: { quantity: true, lineSubtotal: true }, orderBy: { _sum: { lineSubtotal: "desc" } }, take: 8 }),
    db.order.findMany({ orderBy: { placedAt: "desc" }, take: 8, include: { business: { select: { name: true } } } }),
    db.quote.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  const revenue = (current._sum.subtotal ?? 0) - (current._sum.discountTotal ?? 0);
  const prevRevenue = (previous._sum.subtotal ?? 0) - (previous._sum.discountTotal ?? 0);
  const avg = current._count._all ? Math.round(revenue / current._count._all) : 0;
  const delta = (a: number, b: number) => (b > 0 ? `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)} % ${t("admin.dashboard.vsPrevious")}` : undefined);

  return (
    <AdminShell title={t("admin.dashboard.title")} actions={
      <PeriodSelect value={period} label={t("admin.dashboard.period")} options={Object.keys(PERIODS).map((p) => ({ value: p, label: t.enum("admin.dashboard.periods", p) }))} />
    }>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("admin.dashboard.revenue")} value={formatMoney(revenue)} hint={delta(revenue, prevRevenue)} />
        <StatCard label={t("admin.dashboard.orders")} value={String(current._count._all)} hint={delta(current._count._all, previous._count._all)} href="/admin/orders" />
        <StatCard label={t("admin.dashboard.averageOrder")} value={formatMoney(avg)} />
        <StatCard label={t("admin.dashboard.newCustomers")} value={String(newCustomers)} href="/admin/customers" />
        <StatCard label={t("admin.dashboard.pendingQuotes")} value={String(pendingQuotes)} href="/admin/quotes?status=SUBMITTED" tone={pendingQuotes ? "accent" : undefined} />
        <StatCard label={t("admin.dashboard.pendingBusinesses")} value={String(pendingBusinesses)} href="/admin/customers?status=PENDING" tone={pendingBusinesses ? "warning" : undefined} />
        <StatCard label={t("admin.dashboard.lowStock")} value={String(lowStock[0]?.count ?? 0)} href="/admin/inventory?filter=low" tone={lowStock[0]?.count ? "warning" : undefined} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminCard title={t("admin.dashboard.recentOrders")} actions={<Link href="/admin/orders" className="text-xs font-medium text-muted hover:text-foreground">{t("admin.dashboard.seeAll")}</Link>} className="[&>div]:p-0">
          {recentOrders.length ? (
            <ul className="divide-y divide-border">{recentOrders.map((o) => <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-paper"><span><span className="font-semibold">{o.number}</span><span className="block text-xs text-muted">{o.business.name} · {formatDate(o.placedAt)}</span></span><span className="flex items-center gap-3"><StatusBadge status={o.status} label={t.enum("common.status.order", o.status)} /><span className="font-semibold tnum">{formatMoney(o.total)}</span></span></Link></li>)}</ul>
          ) : <p className="p-4 text-sm text-muted">{t("admin.dashboard.noData")}</p>}
        </AdminCard>
        <AdminCard title={t("admin.dashboard.bestsellers")} className="[&>div]:p-0">
          {bestsellers.length ? (
            <ul className="divide-y divide-border">{bestsellers.map((b) => <li key={b.productId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"><span className="line-clamp-1">{b.name}</span><span className="shrink-0 text-xs text-muted">{t("admin.dashboard.quantitySold", { count: b._sum.quantity ?? 0 })} · <span className="font-semibold text-foreground tnum">{formatMoney(b._sum.lineSubtotal ?? 0)}</span></span></li>)}</ul>
          ) : <p className="p-4 text-sm text-muted">{t("admin.dashboard.noData")}</p>}
        </AdminCard>
        <AdminCard title={t("admin.dashboard.recentQuotes")} actions={<Link href="/admin/quotes" className="text-xs font-medium text-muted hover:text-foreground">{t("admin.dashboard.seeAll")}</Link>} className="[&>div]:p-0 lg:col-span-2">
          {recentQuotes.length ? (
            <ul className="divide-y divide-border">{recentQuotes.map((q) => <li key={q.id}><Link href={`/admin/quotes/${q.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-paper"><span><span className="font-semibold">{q.number}</span><span className="block text-xs text-muted">{q.companyName} · {formatDate(q.createdAt)}</span></span><StatusBadge status={q.status} label={t.enum("common.status.quote", q.status)} /></Link></li>)}</ul>
          ) : <p className="p-4 text-sm text-muted">{t("admin.dashboard.noData")}</p>}
        </AdminCard>
      </div>
    </AdminShell>
  );
}
