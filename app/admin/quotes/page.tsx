import Link from "next/link";
import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { FilterBar, FilterSelect, AdminPagination } from "@/components/admin/ui";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";

const STATUSES = ["SUBMITTED", "IN_REVIEW", "QUOTED", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"];
const PAGE = 30;

export default async function AdminQuotesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.QuoteWhereInput = { ...(STATUSES.includes(sp.status ?? "") ? { status: sp.status as "SUBMITTED" } : {}), ...(sp.q ? { OR: [{ number: { contains: sp.q, mode: "insensitive" } }, { companyName: { contains: sp.q, mode: "insensitive" } }, { email: { contains: sp.q, mode: "insensitive" } }] } : {}) };
  const [total, quotes] = await Promise.all([db.quote.count({ where }), db.quote.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { _count: { select: { items: true } } } })]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <AdminShell title={`${t("admin.quotes.title")} (${total})`}>
      <FilterBar searchValue={sp.q} searchPlaceholder={t("admin.table.search")} submitLabel={t("common.actions.filter")}>
        <FilterSelect name="status" value={sp.status} allLabel={t("admin.common.all")} label={t("admin.common.status")} options={STATUSES.map((s) => ({ value: s, label: t.enum("common.status.quote", s) }))} />
      </FilterBar>
      <Table>
        <THead><TR><TH>{t("admin.quotes.columns.number")}</TH><TH>{t("admin.quotes.columns.date")}</TH><TH>{t("admin.quotes.columns.company")}</TH><TH>{t("admin.quotes.columns.contact")}</TH><TH>{t("common.labels.items")}</TH><TH>{t("admin.quotes.columns.status")}</TH><TH className="text-end">{t("admin.quotes.columns.total")}</TH></TR></THead>
        <TBody>
          {quotes.map((q) => (
            <TR key={q.id}><TD><Link href={`/admin/quotes/${q.id}`} className="font-semibold hover:underline">{q.number}</Link></TD><TD className="whitespace-nowrap text-xs">{formatDateTime(q.createdAt)}</TD><TD>{q.companyName}</TD><TD className="text-xs">{q.contactName}<span className="block text-muted">{q.email}</span></TD><TD className="tnum">{q._count.items}</TD><TD><StatusBadge status={q.status} label={t.enum("common.status.quote", q.status)} /></TD><TD className="text-end font-semibold tnum">{q.quotedTotal !== null ? formatMoney(q.quotedTotal) : "—"}</TD></TR>
          ))}
          {!quotes.length && <TR><TD colSpan={7} className="py-8 text-center text-muted">{t("admin.table.noResults")}</TD></TR>}
        </TBody>
      </Table>
      <AdminPagination page={page} totalPages={totalPages} basePath="/admin/quotes" params={{ q: sp.q, status: sp.status }} labels={{ previous: t("common.actions.previous"), next: t("common.actions.next"), page: t("common.labels.page", { page, total: totalPages }) }} />
    </AdminShell>
  );
}
