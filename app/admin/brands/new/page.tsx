import { getT } from "@/i18n/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { BrandForm } from "@/components/admin/brand-form";

export default async function AdminBrandNewPage() {
  const t = await getT();
  return (
    <AdminShell title={t("admin.brands.create")} breadcrumb={[{ label: t("admin.nav.brands"), href: "/admin/brands" }, { label: t("admin.brands.create") }]}>
      <BrandForm />
    </AdminShell>
  );
}
