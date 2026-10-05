import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { PageEditor } from "@/components/admin/page-editor";

export default async function AdminPageEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t] = await Promise.all([params, getT()]);
  const page = await db.cmsPage.findUnique({ where: { id } });
  if (!page) notFound();
  return (
    <AdminShell title={page.title} breadcrumb={[{ label: t("admin.cms.pages.title"), href: "/admin/pages" }, { label: page.title }]} actions={<Button asChild size="sm" variant="outline"><Link href={`/pages/${page.slug}`} target="_blank"><ExternalLink />{t("admin.common.viewOnSite")}</Link></Button>}>
      <PageEditor page={{ id: page.id, title: page.title, slug: page.slug, excerpt: page.excerpt, content: page.content, status: page.status, showInFooter: page.showInFooter, seoTitle: page.seoTitle, seoDescription: page.seoDescription }} />
    </AdminShell>
  );
}
