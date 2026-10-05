import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { BrandForm, BrandDeleteButton } from "@/components/admin/brand-form";

export default async function AdminBrandEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t] = await Promise.all([params, getT()]);
  const brand = await db.brand.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!brand) notFound();
  return (
    <AdminShell
      title={brand.name}
      breadcrumb={[{ label: t("admin.nav.brands"), href: "/admin/brands" }, { label: brand.name }]}
      actions={<><Button asChild size="sm" variant="outline"><Link href={`/brand/${brand.slug}`} target="_blank"><ExternalLink />{t("admin.common.viewOnSite")}</Link></Button>{brand._count.products === 0 && <BrandDeleteButton id={brand.id} afterDelete="list" />}</>}
    >
      <p className="mb-4 text-xs text-muted">{t("admin.brands.columns.products")} : {brand._count.products}</p>
      <BrandForm key={brand.updatedAt.toISOString()} initial={{ id: brand.id, name: brand.name, slug: brand.slug, description: brand.description ?? "", logo: brand.logo ?? "", website: brand.website ?? "", isActive: brand.isActive, isFeatured: brand.isFeatured, sortOrder: brand.sortOrder, seoTitle: brand.seoTitle ?? "", seoDescription: brand.seoDescription ?? "" }} />
    </AdminShell>
  );
}
