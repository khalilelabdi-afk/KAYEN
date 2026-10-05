import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { getPricingContext } from "@/lib/auth/dal";
import { getGuideBySlug, getGuides } from "@/services/cms";
import { getProductsByIds } from "@/services/catalog/products";
import { renderMarkdown, markdownToText } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";
import { Section, SectionHeader } from "@/components/layout/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProductRail } from "@/components/commerce/product-grid";
import { JsonLd, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = await getGuideBySlug((await params).slug);
  if (!guide) return {};
  const description = guide.seoDescription ?? guide.excerpt ?? markdownToText(guide.content);
  return { title: guide.seoTitle ?? guide.title, description, alternates: { canonical: `/guides/${guide.slug}` }, openGraph: { type: "article", title: guide.title, description, images: guide.image ? [{ url: guide.image }] : undefined } };
}

export default async function GuidePage({ params }: Props) {
  const [{ slug }, t, ctx] = await Promise.all([params, getT(), getPricingContext()]);
  const guide = await getGuideBySlug(slug);
  if (!guide) notFound();
  const [products, others] = await Promise.all([getProductsByIds(guide.products.map((p) => p.productId), ctx), getGuides(4)]);
  const related = others.filter((g) => g.id !== guide.id).slice(0, 3);
  const crumbs = [{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("cms.guides.title"), href: "/guides" }, { label: guide.title }];
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(crumbs), articleJsonLd({ title: guide.title, description: guide.excerpt ?? markdownToText(guide.content), slug: guide.slug, image: guide.image, author: guide.authorName, publishedAt: guide.publishedAt, updatedAt: guide.updatedAt })]} />
      <Section className="py-6 md:py-10">
        <Breadcrumb items={crumbs} label={t("common.breadcrumb.label")} className="mb-6" />
        <article className="mx-auto max-w-3xl">
          <p className="text-xs text-muted">{guide.category?.name}{guide.publishedAt && ` · ${formatDate(guide.publishedAt)}`} · {t("cms.guides.readingTime", { minutes: guide.readingMinutes })}{guide.authorName && ` · ${t("cms.guides.by", { author: guide.authorName })}`}</p>
          <h1 className="t-h1 mt-3">{guide.title}</h1>
          {guide.excerpt && <p className="t-body-lg mt-4 text-muted">{guide.excerpt}</p>}
          {guide.image && (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg border border-border bg-paper-2">
              <Image src={guide.image} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" loading="eager" />
            </div>
          )}
          <div className="prose-kayen mt-8 text-[15px] md:text-base" dangerouslySetInnerHTML={{ __html: renderMarkdown(guide.content) }} />
        </article>
      </Section>
      {products.length > 0 && (
        <Section bordered className="py-8 md:py-12">
          <SectionHeader title={t("cms.guides.relatedProducts")} />
          <ProductRail products={products} listId={`guide_${guide.slug}`} />
        </Section>
      )}
      {related.length > 0 && (
        <Section bordered className="py-8 md:py-12">
          <SectionHeader title={t("cms.guides.relatedGuides")} cta={{ label: t("cms.guides.allGuides"), href: "/guides" }} />
          <ul className="grid gap-6 md:grid-cols-3">
            {related.map((g) => (
              <li key={g.id}><Link href={g.href} className="group block"><div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border bg-paper-2">{g.image && <Image src={g.image} alt="" fill sizes="33vw" className="object-cover" />}</div><h3 className="t-h4 mt-3 group-hover:text-accent">{g.title}</h3></Link></li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
