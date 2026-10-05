import Link from "next/link";
import { Plus } from "lucide-react";
import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { FilterBar, FilterSelect } from "@/components/admin/ui";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export default async function AdminPagesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const status = STATUSES.find((s) => s === sp.status);
  const where: Prisma.CmsPageWhereInput = { ...(status ? { status } : {}), ...(sp.q ? { OR: [{ title: { contains: sp.q, mode: "insensitive" } }, { slug: { contains: sp.q, mode: "insensitive" } }] } : {}) };
  const pages = await db.cmsPage.findMany({ where, orderBy: { updatedAt: "desc" } });
  return (
    <AdminShell title={`${t("admin.cms.pages.title")} (${pages.length})`} actions={<Button asChild size="sm"><Link href="/admin/pages/new"><Plus />{t("admin.cms.pages.create")}</Link></Button>}>
      <FilterBar searchValue={sp.q} searchPlaceholder={t("admin.table.search")} submitLabel={t("common.actions.filter")}>
        <FilterSelect name="status" value={sp.status} allLabel={t("admin.common.all")} label={t("admin.cms.pages.columns.status")} options={STATUSES.map((s) => ({ value: s, label: t.enum("common.status.content", s) }))} />
      </FilterBar>
      <Table>
        <THead><TR><TH>{t("admin.cms.pages.columns.title")}</TH><TH>{t("admin.cms.pages.columns.slug")}</TH><TH>{t("admin.cms.pages.columns.status")}</TH><TH>{t("admin.cms.pages.columns.updated")}</TH></TR></THead>
        <TBody>
          {pages.map((p) => (
            <TR key={p.id}>
              <TD><Link href={`/admin/pages/${p.id}`} className="font-semibold hover:underline">{p.title}</Link>{p.showInFooter && <Badge variant="soft" className="ms-2">{t("admin.cms.pages.form.showInFooter")}</Badge>}</TD>
              <TD><Link href={`/pages/${p.slug}`} target="_blank" className="font-mono text-xs text-muted hover:underline">/pages/{p.slug}</Link></TD>
              <TD><StatusBadge status={p.status} label={t.enum("common.status.content", p.status)} /></TD>
              <TD className="whitespace-nowrap text-xs">{formatDateTime(p.updatedAt)}</TD>
            </TR>
          ))}
          {!pages.length && <TR><TD colSpan={4} className="py-8 text-center text-muted">{t("admin.table.noResults")}</TD></TR>}
        </TBody>
      </Table>
    </AdminShell>
  );
}
