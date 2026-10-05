import type { Metadata } from "next";
import Link from "next/link";
import { Package, FileText, ListChecks, Zap, ArrowRight, RotateCcw } from "lucide-react";
import { getT } from "@/i18n/server";
import { requireUser, getPricingContext } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { AccountShell } from "@/components/account/account-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReorderButton } from "@/components/account/reorder-button";
import { getProductsByIds } from "@/services/catalog/products";
import { ProductRail } from "@/components/commerce/product-grid";
import { Alert } from "@/components/ui/alert";
import { ResendVerification } from "@/components/account/resend-verification";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.nav.overview"), robots: { index: false } };
}

export default async function AccountOverviewPage() {
  const [t, user, ctx] = await Promise.all([getT(), requireUser("/account"), getPricingContext()]);
  const businessId = user.business?.id ?? "__none__";
  const [orders, quotes, stats, listsCount, frequent] = await Promise.all([
    db.order.findMany({ where: { businessId }, orderBy: { placedAt: "desc" }, take: 5, include: { _count: { select: { items: true } } } }),
    db.quote.findMany({ where: { businessId }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.order.aggregate({ where: { businessId, status: { notIn: ["CANCELLED", "REFUNDED"] } }, _count: { _all: true }, _sum: { total: true } }),
    db.shoppingList.count({ where: { businessId } }),
    db.orderItem.groupBy({ by: ["productId"], where: { order: { businessId }, productId: { not: null } }, _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 8 }),
  ]);
  const pendingQuotes = quotes.filter((q) => ["SUBMITTED", "IN_REVIEW", "QUOTED"].includes(q.status)).length;
  const frequentProducts = await getProductsByIds(frequent.map((f) => f.productId!).filter(Boolean), ctx);
  const cards = [
    { label: t("account.overview.stats.orders"), value: String(stats._count._all), href: "/account/orders", icon: Package },
    { label: t("account.overview.stats.spent"), value: formatMoney(stats._sum.total ?? 0), href: "/account/orders", icon: Package },
    { label: t("account.overview.stats.quotes"), value: String(pendingQuotes), href: "/account/quotes", icon: FileText },
    { label: t("account.overview.stats.lists"), value: String(listsCount), href: "/account/lists", icon: ListChecks },
  ];
  return (
    <AccountShell user={user} title={t("account.overview.welcome", { name: user.firstName })}>
      {!user.emailVerified && <Alert tone="info" className="mb-6" actions={<ResendVerification />}>{t("auth.verify.pendingBanner", { email: user.email })}</Alert>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-ink">
            <c.icon className="size-4 text-muted" aria-hidden />
            <p className="mt-2 text-2xl font-bold tnum">{c.value}</p>
            <p className="text-xs text-muted">{c.label}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/quick-order"><Zap />{t("account.nav.quickOrder")}</Link></Button>
        <Button asChild variant="outline" size="sm"><Link href="/quote"><FileText />{t("common.actions.requestQuote")}</Link></Button>
        {orders[0] && <ReorderButton orderId={orders[0].id} label={t("account.overview.reorderLast")} size="sm" variant="outline" icon={<RotateCcw />} />}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="t-h4">{t("account.overview.recentOrders")}</h2><Link href="/account/orders" className="text-xs font-medium text-muted hover:text-foreground">{t("account.overview.seeAllOrders")}</Link></div>
          {orders.length ? (
            <ul className="divide-y divide-border">
              {orders.map((o) => (
                <li key={o.id}><Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-paper"><span><span className="font-semibold">{o.number}</span><span className="block text-xs text-muted">{formatDate(o.placedAt)} · {t.plural("account.orders.items", o._count.items)}</span></span><span className="flex items-center gap-3"><StatusBadge status={o.status} label={t.enum("common.status.order", o.status)} /><span className="font-semibold tnum">{formatMoney(o.total)}</span><ArrowRight className="size-4 text-subtle rtl:rotate-180" /></span></Link></li>
              ))}
            </ul>
          ) : <p className="px-4 py-6 text-sm text-muted">{t("account.overview.noOrders")}</p>}
        </section>
        <section className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="t-h4">{t("account.overview.recentQuotes")}</h2><Link href="/account/quotes" className="text-xs font-medium text-muted hover:text-foreground">{t("account.overview.seeAllQuotes")}</Link></div>
          {quotes.length ? (
            <ul className="divide-y divide-border">
              {quotes.map((q) => (
                <li key={q.id}><Link href={`/account/quotes/${q.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-paper"><span><span className="font-semibold">{q.number}</span><span className="block text-xs text-muted">{formatDate(q.createdAt)}</span></span><span className="flex items-center gap-3"><StatusBadge status={q.status} label={t.enum("common.status.quote", q.status)} />{q.quotedTotal !== null && <span className="font-semibold tnum">{formatMoney(q.quotedTotal)}</span>}<ArrowRight className="size-4 text-subtle rtl:rotate-180" /></span></Link></li>
              ))}
            </ul>
          ) : <p className="px-4 py-6 text-sm text-muted">{t("account.overview.noQuotes")}</p>}
        </section>
      </div>
      {frequentProducts.length > 0 && (
        <section className="mt-10">
          <h2 className="t-h3 mb-4">{t("account.overview.frequentProducts")}</h2>
          <ProductRail products={frequentProducts} listId="account_frequent" />
        </section>
      )}
    </AccountShell>
  );
}
