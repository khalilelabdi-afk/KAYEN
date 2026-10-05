import { getT } from "@/i18n/server";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { GuideEditor } from "@/components/admin/guide-editor";

export default async function AdminGuideNewPage() {
  const [t, user, categories] = await Promise.all([getT(), requireStaff(), db.blogCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } })]);
  return (
    <AdminShell title={t("admin.cms.guides.create")} breadcrumb={[{ label: t("admin.cms.guides.title"), href: "/admin/guides" }, { label: t("admin.cms.guides.create") }]}>
      <GuideEditor categories={categories} defaultAuthor={user.fullName} />
    </AdminShell>
  );
}
