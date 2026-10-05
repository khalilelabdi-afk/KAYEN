import Link from "next/link";
import { Plus } from "lucide-react";
import { getT } from "@/i18n/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { CategoryTree } from "@/components/admin/category-tree";
import { loadCategoryTree } from "./queries";

export default async function AdminCategoriesPage() {
  const [t, rows] = await Promise.all([getT(), loadCategoryTree()]);
  return (
    <AdminShell title={`${t("admin.categories.title")} (${rows.length})`} actions={<Button asChild size="sm"><Link href="/admin/categories/new"><Plus />{t("admin.categories.create")}</Link></Button>}>
      <CategoryTree rows={rows} />
    </AdminShell>
  );
}
