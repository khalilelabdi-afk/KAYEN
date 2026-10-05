import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { SectorForm } from "@/components/admin/sector-form";

export default async function AdminSectorEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t, categories] = await Promise.all([params, getT(), db.category.findMany({ orderBy: { path: "asc" }, select: { id: true, name: true, path: true, level: true } })]);
  const sector = await db.sector.findUnique({ where: { id }, include: { categories: { orderBy: { sortOrder: "asc" }, select: { categoryId: true } }, products: { orderBy: { sortOrder: "asc" }, select: { product: { select: { sku: true } } } } } });
  if (!sector) notFound();
  const data = { id: sector.id, name: sector.name, slug: sector.slug, heroTitle: sector.heroTitle, heroSubtitle: sector.heroSubtitle, description: sector.description, image: sector.image, icon: sector.icon, sortOrder: sector.sortOrder, isActive: sector.isActive, seoTitle: sector.seoTitle, seoDescription: sector.seoDescription, categoryIds: sector.categories.map((c) => c.categoryId), productSkus: sector.products.map((p) => p.product.sku) };
  return (
    <AdminShell title={sector.name} breadcrumb={[{ label: t("admin.cms.sectors.title"), href: "/admin/sectors" }, { label: sector.name }]} actions={<Button asChild size="sm" variant="outline"><Link href={`/professionnels/${sector.slug}`} target="_blank"><ExternalLink />{t("admin.common.viewOnSite")}</Link></Button>}>
      <SectorForm sector={data} categories={categories} />
    </AdminShell>
  );
}
