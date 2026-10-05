import Link from "next/link";
import { Download } from "lucide-react";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard } from "@/components/admin/ui";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImportUploadForm } from "@/components/admin/import-panels";

export default async function AdminImportsPage() {
  const [t, imports] = await Promise.all([getT(), db.catalogImport.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { firstName: true, lastName: true } } } })]);
  return (
    <AdminShell title={t("admin.products.import.title")} actions={<Button asChild size="sm" variant="outline"><a href="/admin/imports/template" download="modele-import-kayen.csv"><Download />{t("admin.products.import.template")}</a></Button>}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <AdminCard title={t("admin.products.import.upload")}>
          <p className="mb-4 text-sm text-muted">{t("admin.products.import.desc")}</p>
          <ImportUploadForm />
        </AdminCard>
        <AdminCard title={t("admin.products.import.columns")}>
          <p className="text-sm text-muted">{t("admin.products.import.columnsHint")}</p>
          <p className="mt-3 text-sm text-muted">{t("admin.products.import.confirmHint")}</p>
        </AdminCard>
      </div>
      <AdminCard title={t("admin.products.import.history")} className="mt-6 [&>div]:p-0">
        <Table>
          <THead><TR><TH>{t("admin.products.import.historyColumns.date")}</TH><TH>{t("admin.products.import.historyColumns.file")}</TH><TH>{t("admin.products.import.historyColumns.status")}</TH><TH className="text-end">{t("admin.products.import.historyColumns.rows")}</TH><TH className="text-end">{t("admin.products.import.historyColumns.valid")}</TH><TH className="text-end">{t("admin.products.import.historyColumns.errors")}</TH><TH>{t("admin.products.import.historyColumns.user")}</TH></TR></THead>
          <TBody>
            {imports.map((i) => (
              <TR key={i.id}>
                <TD className="whitespace-nowrap text-xs">{formatDateTime(i.createdAt)}</TD>
                <TD><Link href={`/admin/imports/${i.id}`} className="font-medium hover:underline">{i.filename}</Link></TD>
                <TD><StatusBadge status={i.status} label={t.enum("admin.products.import.statuses", i.status)} /></TD>
                <TD className="text-end tnum">{i.totalRows}</TD>
                <TD className="text-end tnum">{i.validRows}</TD>
                <TD className={`text-end tnum ${i.errorRows ? "text-error" : ""}`}>{i.errorRows}</TD>
                <TD className="text-xs text-muted">{i.user ? `${i.user.firstName} ${i.user.lastName}` : t("admin.audit.system")}</TD>
              </TR>
            ))}
            {!imports.length && <TR><TD colSpan={7} className="py-8 text-center text-muted">{t("admin.table.noResults")}</TD></TR>}
          </TBody>
        </Table>
      </AdminCard>
    </AdminShell>
  );
}
