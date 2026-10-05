import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { FilterBar, FilterSelect, AdminPagination } from "@/components/admin/ui";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const PAGE = 50;

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold text-muted">{label}</p>
      <pre className="max-h-64 overflow-auto rounded-md border border-border bg-paper p-2 font-mono text-[11px] leading-snug">{value === null || value === undefined ? "—" : JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ q?: string; action?: string; entity?: string; page?: string }> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const [actions, entities] = await Promise.all([
    db.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
    db.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true }, orderBy: { entityType: "asc" } }),
  ]);
  const where: Prisma.AuditLogWhereInput = {
    ...(sp.action ? { action: sp.action } : {}),
    ...(sp.entity ? { entityType: sp.entity } : {}),
    ...(sp.q ? { OR: [{ entityId: { contains: sp.q, mode: "insensitive" } }, { user: { email: { contains: sp.q, mode: "insensitive" } } }] } : {}),
  };
  const [total, logs] = await Promise.all([db.auditLog.count({ where }), db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { user: { select: { firstName: true, lastName: true, email: true } } } })]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <AdminShell title={`${t("admin.audit.title")} (${t("admin.audit.total", { count: total })})`}>
      <FilterBar searchValue={sp.q} searchPlaceholder={t("admin.table.search")} submitLabel={t("common.actions.filter")}>
        <FilterSelect name="action" value={sp.action} allLabel={t("admin.common.all")} label={t("admin.audit.filters.action")} options={actions.map((a) => ({ value: a.action, label: a.action }))} />
        <FilterSelect name="entity" value={sp.entity} allLabel={t("admin.common.all")} label={t("admin.audit.filters.entity")} options={entities.map((e) => ({ value: e.entityType, label: e.entityType }))} />
      </FilterBar>
      <Table>
        <THead><TR><TH>{t("admin.audit.columns.date")}</TH><TH>{t("admin.audit.columns.user")}</TH><TH>{t("admin.audit.columns.action")}</TH><TH>{t("admin.audit.columns.entity")}</TH><TH>{t("admin.audit.columns.details")}</TH></TR></THead>
        <TBody>
          {logs.map((l) => (
            <TR key={l.id} className="align-top">
              <TD className="whitespace-nowrap text-xs">{formatDateTime(l.createdAt)}</TD>
              <TD className="text-xs">{l.user ? <>{l.user.firstName} {l.user.lastName}<span className="block text-muted">{l.user.email}</span></> : <span className="text-muted">{t("admin.audit.system")}</span>}</TD>
              <TD><Badge variant="outline" className="font-mono">{l.action}</Badge></TD>
              <TD className="text-xs"><span className="font-medium">{l.entityType}</span>{l.entityId && <span className="block font-mono text-muted">{l.entityId}</span>}</TD>
              <TD className="text-xs">
                {l.before === null && l.after === null ? <span className="text-muted">{t("admin.audit.noDetails")}</span> : (
                  <details className="group">
                    <summary className="cursor-pointer font-medium underline-offset-2 hover:underline">{t("admin.audit.showDetails")}</summary>
                    <div className="mt-2 grid gap-3 md:grid-cols-2"><JsonBlock label={t("admin.audit.before")} value={l.before} /><JsonBlock label={t("admin.audit.after")} value={l.after} /></div>
                  </details>
                )}
              </TD>
            </TR>
          ))}
          {!logs.length && <TR><TD colSpan={5} className="py-8 text-center text-muted">{t("admin.table.noResults")}</TD></TR>}
        </TBody>
      </Table>
      <AdminPagination page={page} totalPages={totalPages} basePath="/admin/audit" params={{ q: sp.q, action: sp.action, entity: sp.entity }} labels={{ previous: t("common.actions.previous"), next: t("common.actions.next"), page: t("common.labels.page", { page, total: totalPages }) }} />
    </AdminShell>
  );
}
