import Link from "next/link";
import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { FilterBar, FilterSelect, AdminPagination } from "@/components/admin/ui";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const PAYMENTS = ["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED"];
const PAGE = 30;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; payment?: string; page?: string }> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.OrderWhereInput = {
    ...(STATUSES.includes(sp.status ?? "") ? { status: sp.status as "PENDING" } : {}),
    ...(PAYMENTS.includes(sp.payment ?? "") ? { paymentStatus: sp.payment as "PAID" } : {}),
    ...(sp.q ? { OR: [{ number: { contains: sp.q, mode: "insensitive" } }, { business: { name: { contains: sp.q, mode: "insensitive" } } }, { poReference: { contains: sp.q, mode: "insensitive" } }, { items: { some: { sku: { contains: sp.q, mode: "insensitive" } } } }] } : {}),
  };
  const [total, orders] = await Promise.all([db.order.count({ where }), db.order.findMany({ where, orderBy: { placedAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { business: { select: { name: true } }, _count: { select: { items: true } } } })]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <AdminShell title={`${t("admin.orders.title")} (${total})`} actions={<Button asChild size="sm" variant="outline"><a href={`/admin/orders/export?${new URLSearchParams({ q: sp.q ?? "", status: sp.status ?? "" }).toString()}`}>{t("admin.common.export")}</a></Button>}>
      <FilterBar searchValue={sp.q} searchPlaceholder={t("admin.table.search")} submitLabel={t("common.actions.filter")}>
        <FilterSelect name="status" value={sp.status} allLabel={t("admin.common.all")} label={t("admin.orders.filters.status")} options={STATUSES.map((s) => ({ value: s, label: t.enum("common.status.order", s) }))} />
        <FilterSelect name="payment" value={sp.payment} allLabel={t("admin.common.all")} label={t("admin.orders.filters.payment")} options={PAYMENTS.map((s) => ({ value: s, label: t.enum("common.status.payment", s) }))} />
      </FilterBar>
      <Table>
        <THead><TR><TH>{t("admin.orders.columns.number")}</TH><TH>{t("admin.orders.columns.date")}</TH><TH>{t("admin.orders.columns.customer")}</TH><TH>{t("admin.orders.columns.items")}</TH><TH>{t("admin.orders.columns.status")}</TH><TH>{t("admin.orders.columns.payment")}</TH><TH className="text-end">{t("admin.orders.columns.total")}</TH></TR></THead>
        <TBody>
          {orders.map((o) => (
            <TR key={o.id}>
              <TD><Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">{o.number}</Link>{o.poReference && <span className="block text-xs text-muted">{o.poReference}</span>}</TD>
              <TD className="whitespace-nowrap text-xs">{formatDateTime(o.placedAt)}</TD>
              <TD>{o.business.name}</TD>
              <TD className="tnum">{o._count.items}</TD>
              <TD><StatusBadge status={o.status} label={t.enum("common.status.order", o.status)} /></TD>
              <TD><StatusBadge status={o.paymentStatus} label={t.enum("common.status.payment", o.paymentStatus)} /><span className="block text-xs text-muted">{t.enum("common.status.paymentMethod", o.paymentMethod)}</span></TD>
              <TD className="text-end font-semibold tnum">{formatMoney(o.total)}</TD>
            </TR>
          ))}
          {!orders.length && <TR><TD colSpan={7} className="py-8 text-center text-muted">{t("admin.table.noResults")}</TD></TR>}
        </TBody>
      </Table>
      <AdminPagination page={page} totalPages={totalPages} basePath="/admin/orders" params={{ q: sp.q, status: sp.status, payment: sp.payment }} labels={{ previous: t("common.actions.previous"), next: t("common.actions.next"), page: t("common.labels.page", { page, total: totalPages }) }} />
    </AdminShell>
  );
}
