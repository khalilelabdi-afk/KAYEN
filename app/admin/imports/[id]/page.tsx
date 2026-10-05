import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { interpolate } from "@/i18n";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard, StatCard } from "@/components/admin/ui";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { ImportConfirmButton } from "@/components/admin/import-panels";
import type { ImportStoredPayload } from "@/app/actions/admin/imports";

const PREVIEW = 50;

export default async function AdminImportReportPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t] = await Promise.all([params, getT()]);
  const record = await db.catalogImport.findUnique({ where: { id }, include: { user: { select: { firstName: true, lastName: true } } } });
  if (!record) notFound();
  const payload = (record.errors as unknown as ImportStoredPayload | null) ?? { errors: [], rows: [] };
  const codes = t.dict.admin.products.import.codes as Record<string, string>;
  const label = (code: string, value?: string) => (codes[code] ? interpolate(codes[code], { value: value ?? "" }) : code);
  return (
    <AdminShell title={t("admin.products.import.reportTitle", { filename: record.filename })} breadcrumb={[{ label: t("admin.nav.imports"), href: "/admin/imports" }, { label: record.filename }]} actions={<StatusBadge status={record.status} label={t.enum("admin.products.import.statuses", record.status)} className="text-sm" />}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("admin.products.import.historyColumns.rows")} value={String(record.totalRows)} hint={`${formatDateTime(record.createdAt)}${record.user ? ` · ${record.user.firstName} ${record.user.lastName}` : ""}`} />
        <StatCard label={t("admin.products.import.historyColumns.valid")} value={String(record.validRows)} tone={record.validRows ? "accent" : undefined} />
        <StatCard label={t("admin.products.import.historyColumns.errors")} value={String(record.errorRows)} tone={record.errorRows ? "warning" : undefined} />
      </div>
      <div className="mt-6 space-y-6">
        {record.status === "VALIDATED" && record.validRows > 0 && <ImportConfirmButton id={record.id} count={record.validRows} />}
        {record.status === "COMPLETED" && <Alert tone="success">{t("admin.products.import.done", { count: record.validRows })}</Alert>}
        {record.status === "FAILED" && <Alert tone="error">{t("admin.products.import.nothingToImport")}</Alert>}
        {payload.errors.length > 0 && (
          <AdminCard title={`${t("admin.products.import.errors")} (${payload.errors.length})`} className="[&>div]:p-0">
            <Table>
              <THead><TR><TH>{t("admin.products.import.columnsTable.line")}</TH><TH>{t("admin.products.import.columnsTable.sku")}</TH><TH>{t("admin.products.import.columnsTable.errors")}</TH></TR></THead>
              <TBody>{payload.errors.map((e) => <TR key={e.line}><TD className="tnum">{t("admin.products.import.line", { line: e.line })}</TD><TD className="font-mono text-xs">{e.sku ?? "—"}</TD><TD><ul className="list-disc ps-4 text-sm text-error">{e.errors.map((x, i) => <li key={i}>{label(x.code, x.value)}</li>)}</ul></TD></TR>)}</TBody>
            </Table>
          </AdminCard>
        )}
        {payload.rows.length > 0 && (
          <AdminCard title={`${t("admin.products.import.preview")} (${Math.min(PREVIEW, payload.rows.length)} / ${payload.rows.length})`} className="[&>div]:p-0">
            <Table>
              <THead><TR><TH>{t("admin.products.import.columnsTable.line")}</TH><TH>{t("admin.products.import.columnsTable.sku")}</TH><TH>{t("admin.products.import.columnsTable.name")}</TH><TH>{t("admin.products.import.columnsTable.category")}</TH><TH className="text-end">{t("admin.products.import.columnsTable.price")}</TH><TH className="text-end">{t("admin.products.import.columnsTable.stock")}</TH></TR></THead>
              <TBody>{payload.rows.slice(0, PREVIEW).map((r) => <TR key={r.line}><TD className="tnum">{r.line}</TD><TD className="font-mono text-xs">{r.sku}</TD><TD>{r.name}{r.brandSlug && <span className="block text-xs text-muted">{r.brandSlug}</span>}</TD><TD className="font-mono text-xs">{r.categorySlug}</TD><TD className="text-end tnum">{formatMoney(r.priceHt)}{r.tiers.length > 0 && <span className="block text-xs text-muted">{r.tiers.length} {t("admin.products.form.tiers").toLowerCase()}</span>}</TD><TD className="text-end tnum">{r.stock ?? "—"}</TD></TR>)}</TBody>
            </Table>
          </AdminCard>
        )}
      </div>
    </AdminShell>
  );
}
