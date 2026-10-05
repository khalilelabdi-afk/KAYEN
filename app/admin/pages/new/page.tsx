import { getT } from "@/i18n/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageEditor } from "@/components/admin/page-editor";

export default async function AdminPageNewPage() {
  const t = await getT();
  return (
    <AdminShell title={t("admin.cms.pages.create")} breadcrumb={[{ label: t("admin.cms.pages.title"), href: "/admin/pages" }, { label: t("admin.cms.pages.create") }]}>
      <PageEditor />
    </AdminShell>
  );
}
