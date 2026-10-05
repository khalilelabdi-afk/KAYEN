import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { SectorForm } from "@/components/admin/sector-form";

export default async function AdminSectorNewPage() {
  const [t, categories] = await Promise.all([getT(), db.category.findMany({ orderBy: { path: "asc" }, select: { id: true, name: true, path: true, level: true } })]);
  return (
    <AdminShell title={t("admin.cms.sectors.create")} breadcrumb={[{ label: t("admin.cms.sectors.title"), href: "/admin/sectors" }, { label: t("admin.cms.sectors.create") }]}>
      <SectorForm categories={categories} />
    </AdminShell>
  );
}
