import Link from "next/link";
import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { FilterBar, FilterSelect, AdminPagination } from "@/components/admin/ui";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUSES = ["PENDING", "VERIFIED", "APPROVED", "REJECTED", "SUSPENDED"];
const PAGE = 30;

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; group?: string; page?: string }> }) {
  const [t, sp, groups] = await Promise.all([getT(), searchParams, db.customerGroup.findMany({ orderBy: { name: "asc" } })]);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.BusinessWhereInput = { ...(STATUSES.includes(sp.status ?? "") ? { status: sp.status as "PENDING" } : {}), ...(sp.group ? { customerGroupId: sp.group } : {}), ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: "insensitive" } }, { email: { contains: sp.q, mode: "insensitive" } }, { taxId: { contains: sp.q, mode: "insensitive" } }, { members: { some: { user: { email: { contains: sp.q, mode: "insensitive" } } } } }] } : {}) };
  const [total, businesses] = await Promise.all([db.business.count({ where }), db.business.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { customerGroup: true, members: { where: { role: "OWNER" }, include: { user: true }, take: 1 }, orders: { where: { status: { notIn: ["CANCELLED", "REFUNDED"] } }, select: { total: true, subtotal: true, discountTotal: true, placedAt: true } } } })]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <AdminShell title={`${t("admin.customers.title")} (${total})`} actions={<Button asChild size="sm" variant="outline"><Link href="/admin/customers/groups">{t("admin.customers.groups.title")}</Link></Button>}>
      <FilterBar searchValue={sp.q} searchPlaceholder={t("admin.table.search")} submitLabel={t("common.actions.filter")}>
        <FilterSelect name="status" value={sp.status} allLabel={t("admin.common.all")} label={t("admin.customers.filters.status")} options={STATUSES.map((s) => ({ value: s, label: t.enum("common.status.business", s) }))} />
        <FilterSelect name="group" value={sp.group} allLabel={t("admin.common.all")} label={t("admin.customers.filters.group")} options={groups.map((g) => ({ value: g.id, label: g.name }))} />
      </FilterBar>
      <Table>
        <THead><TR><TH>{t("admin.customers.columns.company")}</TH><TH>{t("admin.customers.columns.contact")}</TH><TH>{t("admin.customers.columns.status")}</TH><TH>{t("admin.customers.columns.group")}</TH><TH className="text-end">{t("admin.customers.columns.orders")}</TH><TH className="text-end">{t("admin.customers.columns.revenue")}</TH><TH>{t("admin.customers.columns.lastOrder")}</TH></TR></THead>
        <TBody>
          {businesses.map((b) => {
            const revenue = b.orders.reduce((s, o) => s + o.subtotal - o.discountTotal, 0);
            const last = b.orders.reduce<Date | null>((m, o) => (!m || o.placedAt > m ? o.placedAt : m), null);
            const owner = b.members[0]?.user;
            return (
              <TR key={b.id}>
                <TD><Link href={`/admin/customers/${b.id}`} className="font-semibold hover:underline">{b.name}</Link><span className="block text-xs text-muted">{formatDate(b.createdAt)}</span></TD>
                <TD className="text-xs">{owner ? `${owner.firstName} ${owner.lastName}` : "—"}<span className="block text-muted">{owner?.email ?? b.email}</span></TD>
                <TD><StatusBadge status={b.status} label={t.enum("common.status.business", b.status)} /></TD>
                <TD className="text-xs">{b.customerGroup?.name ?? "—"}</TD>
                <TD className="text-end tnum">{b.orders.length}</TD>
                <TD className="text-end font-semibold tnum">{formatMoney(revenue)}</TD>
                <TD className="text-xs">{last ? formatDate(last) : "—"}</TD>
              </TR>
            );
          })}
          {!businesses.length && <TR><TD colSpan={7} className="py-8 text-center text-muted">{t("admin.table.noResults")}</TD></TR>}
        </TBody>
      </Table>
      <AdminPagination page={page} totalPages={totalPages} basePath="/admin/customers" params={{ q: sp.q, status: sp.status, group: sp.group }} labels={{ previous: t("common.actions.previous"), next: t("common.actions.next"), page: t("common.labels.page", { page, total: totalPages }) }} />
    </AdminShell>
  );
}
