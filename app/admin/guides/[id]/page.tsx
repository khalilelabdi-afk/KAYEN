import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getT } from "@/i18n/server";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { GuideEditor } from "@/components/admin/guide-editor";

export default async function AdminGuideEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t, user, categories] = await Promise.all([params, getT(), requireStaff(), db.blogCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } })]);
  const guide = await db.blogPost.findUnique({ where: { id }, include: { products: { orderBy: { sortOrder: "asc" }, select: { product: { select: { sku: true } } } } } });
  if (!guide) notFound();
  const data = { id: guide.id, title: guide.title, slug: guide.slug, excerpt: guide.excerpt, content: guide.content, image: guide.image, categoryId: guide.categoryId, authorName: guide.authorName, readingMinutes: guide.readingMinutes, status: guide.status, publishedAt: guide.publishedAt ? guide.publishedAt.toISOString().slice(0, 10) : null, productSkus: guide.products.map((p) => p.product.sku), seoTitle: guide.seoTitle, seoDescription: guide.seoDescription };
  return (
    <AdminShell title={guide.title} breadcrumb={[{ label: t("admin.cms.guides.title"), href: "/admin/guides" }, { label: guide.title }]} actions={<Button asChild size="sm" variant="outline"><Link href={`/guides/${guide.slug}`} target="_blank"><ExternalLink />{t("admin.common.viewOnSite")}</Link></Button>}>
      <GuideEditor guide={data} categories={categories} defaultAuthor={user.fullName} />
    </AdminShell>
  );
}
