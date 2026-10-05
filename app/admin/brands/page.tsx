import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus } from "lucide-react";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { FilterBar } from "@/components/admin/ui";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { BrandDeleteButton } from "@/components/admin/brand-form";

export default async function AdminBrandsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const brands = await db.brand.findMany({ where: sp.q ? { name: { contains: sp.q, mode: "insensitive" } } : undefined, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  return (
    <AdminShell title={`${t("admin.brands.title")} (${brands.length})`} actions={<Button asChild size="sm"><Link href="/admin/brands/new"><Plus />{t("admin.brands.create")}</Link></Button>}>
      <FilterBar searchValue={sp.q} searchPlaceholder={t("admin.table.search")} submitLabel={t("common.actions.filter")} />
      <Table>
        <THead><TR><TH>{t("admin.brands.columns.name")}</TH><TH>{t("admin.brands.form.slug")}</TH><TH className="text-end">{t("admin.brands.columns.products")}</TH><TH className="text-end">{t("admin.brands.form.sortOrder")}</TH><TH>{t("admin.brands.columns.featured")}</TH><TH>{t("admin.brands.columns.active")}</TH><TH className="text-end">{t("common.labels.actions")}</TH></TR></THead>
        <TBody>
          {brands.map((b) => (
            <TR key={b.id}>
              <TD>
                <Link href={`/admin/brands/${b.id}`} className="flex items-center gap-3 hover:underline">
                  <span className="relative size-9 shrink-0 overflow-hidden rounded-md border border-border bg-surface">{b.logo && <Image src={b.logo} alt="" fill sizes="36px" className="object-contain p-1" unoptimized />}</span>
                  <span className="font-medium">{b.name}</span>
                </Link>
              </TD>
              <TD className="font-mono text-xs text-muted">{b.slug}</TD>
              <TD className="text-end tnum">{b._count.products}</TD>
              <TD className="text-end tnum">{b.sortOrder}</TD>
              <TD>{b.isFeatured ? <Badge variant="accent" size="sm">{t("common.labels.yes")}</Badge> : <span className="text-xs text-muted">—</span>}</TD>
              <TD>{b.isActive ? <Badge variant="success" size="sm">{t("common.labels.active")}</Badge> : <Badge variant="muted" size="sm">{t("common.labels.inactive")}</Badge>}</TD>
              <TD><span className="flex justify-end gap-0.5"><IconButton size="icon-sm" label={t("common.actions.edit")} asChild><Link href={`/admin/brands/${b.id}`}><Pencil /></Link></IconButton>{b._count.products === 0 && <BrandDeleteButton id={b.id} icon afterDelete="refresh" />}</span></TD>
            </TR>
          ))}
          {!brands.length && <TR><TD colSpan={7} className="py-8 text-center text-muted">{t("admin.table.noResults")}</TD></TR>}
        </TBody>
      </Table>
    </AdminShell>
  );
}
