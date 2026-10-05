import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { getT } from "@/i18n/server";
import { requireUser } from "@/lib/auth/dal";
import { listBusinessOrders } from "@/services/orders";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { AccountShell } from "@/components/account/account-shell";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ReorderButton } from "@/components/account/reorder-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.orders.title"), robots: { index: false } };
}

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const [t, user, sp] = await Promise.all([getT(), requireUser("/account/orders"), searchParams]);
  const orders = user.business ? await listBusinessOrders(user.business.id, { status: STATUSES.includes(sp.status ?? "") ? sp.status : undefined, q: sp.q }) : [];
  return (
    <AccountShell user={user} title={t("account.orders.title")}>
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <Input name="q" defaultValue={sp.q} placeholder={t("account.orders.searchPlaceholder")} aria-label={t("common.actions.search")} className="h-9 w-64 text-sm" />
        <Select name="status" defaultValue={sp.status ?? ""} aria-label={t("account.orders.filterStatus")} className="h-9 w-48 text-sm">
          <option value="">{t("common.labels.all")}</option>
          {STATUSES.map((s) => (<option key={s} value={s}>{t.enum("common.status.order", s)}</option>))}
        </Select>
        <Button type="submit" size="sm" variant="secondary">{t("common.actions.filter")}</Button>
      </form>
      {orders.length ? (
        <>
          <div className="hidden md:block">
            <Table>
              <THead><TR><TH>{t("account.orders.number")}</TH><TH>{t("account.orders.date")}</TH><TH>{t("common.labels.items")}</TH><TH>{t("account.orders.status")}</TH><TH>{t("account.orders.shipping")}</TH><TH className="text-end">{t("account.orders.amount")}</TH><TH /></TR></THead>
              <TBody>
                {orders.map((o) => (
                  <TR key={o.id}>
                    <TD><Link href={`/account/orders/${o.id}`} className="font-semibold hover:underline">{o.number}</Link>{o.poReference && <span className="block text-xs text-muted">{o.poReference}</span>}</TD>
                    <TD>{formatDate(o.placedAt)}</TD>
                    <TD className="tnum">{o._count.items}</TD>
                    <TD><StatusBadge status={o.status} label={t.enum("common.status.order", o.status)} /></TD>
                    <TD className="text-xs text-muted">{o.shipments[0]?.trackingNumber ?? o.shippingMethodName}</TD>
                    <TD className="text-end font-semibold tnum">{formatMoney(o.total)}</TD>
                    <TD className="text-end"><div className="flex justify-end gap-1"><Button asChild size="sm" variant="ghost"><Link href={`/account/orders/${o.id}`}>{t("common.actions.view")}</Link></Button><ReorderButton orderId={o.id} label={t("account.orders.reorder")} size="sm" variant="outline" /></div></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
          <ul className="space-y-3 md:hidden">
            {orders.map((o) => (
              <li key={o.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3"><Link href={`/account/orders/${o.id}`} className="font-semibold hover:underline">{o.number}</Link><StatusBadge status={o.status} label={t.enum("common.status.order", o.status)} /></div>
                <p className="mt-1 text-xs text-muted">{formatDate(o.placedAt)} · {t.plural("account.orders.items", o._count.items)}</p>
                <p className="mt-2 font-semibold tnum">{formatMoney(o.total)}</p>
                <div className="mt-3 flex gap-2"><Button asChild size="sm" variant="outline" className="flex-1"><Link href={`/account/orders/${o.id}`}>{t("common.actions.view")}</Link></Button><ReorderButton orderId={o.id} label={t("account.orders.reorder")} size="sm" /></div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState icon={<Package />} title={t("account.orders.empty")} actions={<Button asChild><Link href="/c">{t("account.orders.emptyCta")}</Link></Button>} />
      )}
    </AccountShell>
  );
}
