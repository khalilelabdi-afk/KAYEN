import Link from "next/link";
import { Plus } from "lucide-react";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminSectorsPage() {
  const [t, sectors] = await Promise.all([getT(), db.sector.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { categories: true, products: true, businesses: true } } } })]);
  return (
    <AdminShell title={`${t("admin.cms.sectors.title")} (${sectors.length})`} actions={<Button asChild size="sm"><Link href="/admin/sectors/new"><Plus />{t("admin.cms.sectors.create")}</Link></Button>}>
      <Table>
        <THead><TR><TH>{t("admin.cms.sectors.columns.name")}</TH><TH>{t("admin.cms.sectors.columns.slug")}</TH><TH className="text-end">{t("admin.cms.sectors.columns.categories")}</TH><TH className="text-end">{t("admin.cms.sectors.columns.products")}</TH><TH className="text-end">{t("common.labels.customers")}</TH><TH className="text-end">{t("admin.cms.sectors.columns.order")}</TH><TH>{t("admin.cms.sectors.columns.active")}</TH></TR></THead>
        <TBody>
          {sectors.map((s) => (
            <TR key={s.id}>
              <TD><Link href={`/admin/sectors/${s.id}`} className="font-semibold hover:underline">{s.name}</Link><span className="block text-xs text-muted">{s.heroTitle}</span></TD>
              <TD><Link href={`/professionnels/${s.slug}`} target="_blank" className="font-mono text-xs text-muted hover:underline">/professionnels/{s.slug}</Link></TD>
              <TD className="text-end tnum">{s._count.categories}</TD>
              <TD className="text-end tnum">{s._count.products}</TD>
              <TD className="text-end tnum">{s._count.businesses}</TD>
              <TD className="text-end tnum">{s.sortOrder}</TD>
              <TD>{s.isActive ? <Badge variant="success">{t("common.labels.yes")}</Badge> : <Badge variant="muted">{t("common.labels.no")}</Badge>}</TD>
            </TR>
          ))}
          {!sectors.length && <TR><TD colSpan={7} className="py-8 text-center text-muted">{t("admin.table.noResults")}</TD></TR>}
        </TBody>
      </Table>
    </AdminShell>
  );
}
