import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { CategoryForm, CategoryDeleteButton } from "@/components/admin/category-form";
import { loadCategoryFormRefs } from "../queries";

export default async function AdminCategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t] = await Promise.all([params, getT()]);
  const [category, refs] = await Promise.all([db.category.findUnique({ where: { id }, include: { attributes: { orderBy: { sortOrder: "asc" } }, _count: { select: { products: true, children: true } } } }), loadCategoryFormRefs()]);
  if (!category) notFound();
  return (
    <AdminShell
      title={category.name}
      breadcrumb={[{ label: t("admin.nav.categories"), href: "/admin/categories" }, { label: category.path }]}
      actions={<><Button asChild size="sm" variant="outline"><Link href={`/c/${category.path}`} target="_blank"><ExternalLink />{t("admin.common.viewOnSite")}</Link></Button>{!category._count.products && !category._count.children && <CategoryDeleteButton id={category.id} />}</>}
    >
      <p className="mb-4 text-xs text-muted">{t("admin.categories.form.path")} : <span className="font-mono">{category.path}</span> · {t("admin.categories.columns.products")} : {category._count.products}</p>
      <CategoryForm
        key={category.updatedAt.toISOString()}
        initial={{ id: category.id, name: category.name, slug: category.slug, parentId: category.parentId, description: category.description ?? "", image: category.image ?? "", icon: category.icon ?? "", sortOrder: category.sortOrder, isVisible: category.isVisible, showInNav: category.showInNav, seoTitle: category.seoTitle ?? "", seoDescription: category.seoDescription ?? "", attributeIds: category.attributes.map((a) => a.attributeId) }}
        categories={refs.categories}
        attributes={refs.attributes}
      />
    </AdminShell>
  );
}
