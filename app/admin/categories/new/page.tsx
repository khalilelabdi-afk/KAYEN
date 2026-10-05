import { getT } from "@/i18n/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { CategoryForm } from "@/components/admin/category-form";
import { loadCategoryFormRefs } from "../queries";

export default async function AdminCategoryNewPage({ searchParams }: { searchParams: Promise<{ parent?: string }> }) {
  const [t, sp, refs] = await Promise.all([getT(), searchParams, loadCategoryFormRefs()]);
  return (
    <AdminShell title={t("admin.categories.form.create")} breadcrumb={[{ label: t("admin.nav.categories"), href: "/admin/categories" }, { label: t("admin.categories.form.create") }]}>
      <CategoryForm initial={{ parentId: sp.parent ?? null }} categories={refs.categories} attributes={refs.attributes} />
    </AdminShell>
  );
}
