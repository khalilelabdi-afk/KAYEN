import Link from "next/link";
import { Plus } from "lucide-react";
import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { FilterBar, FilterSelect } from "@/components/admin/ui";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export default async function AdminGuidesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; category?: string }> }) {
  const [t, sp, categories] = await Promise.all([getT(), searchParams, db.blogCategory.findMany({ orderBy: { sortOrder: "asc" } })]);
  const status = STATUSES.find((s) => s === sp.status);
  const where: Prisma.BlogPostWhereInput = { ...(status ? { status } : {}), ...(sp.category ? { categoryId: sp.category } : {}), ...(sp.q ? { OR: [{ title: { contains: sp.q, mode: "insensitive" } }, { slug: { contains: sp.q, mode: "insensitive" } }] } : {}) };
  const guides = await db.blogPost.findMany({ where, orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }], include: { category: { select: { name: true } } } });
  return (
    <AdminShell title={`${t("admin.cms.guides.title")} (${guides.length})`} actions={<Button asChild size="sm"><Link href="/admin/guides/new"><Plus />{t("admin.cms.guides.create")}</Link></Button>}>
      <FilterBar searchValue={sp.q} searchPlaceholder={t("admin.table.search")} submitLabel={t("common.actions.filter")}>
        <FilterSelect name="status" value={sp.status} allLabel={t("admin.common.all")} label={t("admin.cms.guides.columns.status")} options={STATUSES.map((s) => ({ value: s, label: t.enum("common.status.content", s) }))} />
        <FilterSelect name="category" value={sp.category} allLabel={t("admin.common.all")} label={t("admin.cms.guides.columns.category")} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
      </FilterBar>
      <Table>
        <THead><TR><TH>{t("admin.cms.guides.columns.title")}</TH><TH>{t("admin.cms.guides.columns.category")}</TH><TH>{t("admin.cms.guides.form.authorName")}</TH><TH>{t("admin.cms.guides.columns.status")}</TH><TH>{t("admin.cms.guides.columns.published")}</TH></TR></THead>
        <TBody>
          {guides.map((g) => (
            <TR key={g.id}>
              <TD><Link href={`/admin/guides/${g.id}`} className="font-semibold hover:underline">{g.title}</Link><Link href={`/guides/${g.slug}`} target="_blank" className="block font-mono text-xs text-muted hover:underline">/guides/{g.slug}</Link></TD>
              <TD>{g.category?.name ?? "—"}</TD>
              <TD className="text-xs">{g.authorName ?? "—"}</TD>
              <TD><StatusBadge status={g.status} label={t.enum("common.status.content", g.status)} /></TD>
              <TD className="whitespace-nowrap text-xs">{g.publishedAt ? formatDate(g.publishedAt) : "—"}</TD>
            </TR>
          ))}
          {!guides.length && <TR><TD colSpan={5} className="py-8 text-center text-muted">{t("admin.table.noResults")}</TD></TR>}
        </TBody>
      </Table>
    </AdminShell>
  );
}
