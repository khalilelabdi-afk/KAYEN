import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { getPageBySlug } from "@/services/cms";
import { renderMarkdown, markdownToText } from "@/lib/markdown";
import { Section } from "@/components/layout/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPageBySlug((await params).slug);
  if (!page) return {};
  return { title: page.seoTitle ?? page.title, description: page.seoDescription ?? page.excerpt ?? markdownToText(page.content), alternates: { canonical: `/pages/${page.slug}` } };
}

export default async function CmsPage({ params }: Props) {
  const [{ slug }, t] = await Promise.all([params, getT()]);
  const page = await getPageBySlug(slug);
  if (!page) notFound();
  const needsCompletion = page.content.includes("[À compléter");
  return (
    <Section className="py-6 md:py-10">
      <Breadcrumb items={[{ label: t("common.breadcrumb.home"), href: "/" }, { label: page.title }]} label={t("common.breadcrumb.label")} className="mb-6" />
      <article className="mx-auto max-w-3xl">
        <h1 className="t-h1">{page.title}</h1>
        {page.excerpt && <p className="t-body-lg mt-3 text-muted">{page.excerpt}</p>}
        {needsCompletion && <Alert tone="info" className="mt-6">{t("cms.legal.placeholderNotice")}</Alert>}
        <div className="prose-kayen mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }} />
        <p className="mt-10 text-xs text-muted">{t("common.labels.updated")} {formatDate(page.updatedAt)}</p>
      </article>
    </Section>
  );
}
