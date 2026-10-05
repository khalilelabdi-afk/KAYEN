import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { getT } from "@/i18n/server";
import { getGuides, getGuideCategories } from "@/services/cms";
import { Section } from "@/components/layout/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("cms.guides.title"), description: t("cms.guides.subtitle"), alternates: { canonical: "/guides" } };
}

export default async function GuidesPage({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  const [t, sp, categories] = await Promise.all([getT(), searchParams, getGuideCategories()]);
  const guides = await getGuides(undefined, sp.theme);
  return (
    <Section className="py-6 md:py-10">
      <Breadcrumb items={[{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("cms.guides.title") }]} label={t("common.breadcrumb.label")} className="mb-4" />
      <h1 className="t-h1">{t("cms.guides.title")}</h1>
      <p className="mt-3 max-w-2xl text-muted">{t("cms.guides.subtitle")}</p>
      {categories.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          <li><Link href="/guides" className={cn("inline-flex h-9 items-center rounded-full border px-4 text-sm", !sp.theme ? "border-ink bg-ink text-white" : "border-border bg-surface hover:border-ink")}>{t("common.labels.all")}</Link></li>
          {categories.map((c) => (
            <li key={c.id}><Link href={`/guides?theme=${c.slug}`} className={cn("inline-flex h-9 items-center rounded-full border px-4 text-sm", sp.theme === c.slug ? "border-ink bg-ink text-white" : "border-border bg-surface hover:border-ink")}>{c.name}</Link></li>
          ))}
        </ul>
      )}
      {guides.length ? (
        <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <li key={g.id}>
              <Link href={g.href} className="group block">
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border bg-paper-2">
                  {g.image && <Image src={g.image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />}
                </div>
                <p className="mt-3 text-xs text-muted">{g.category?.name}{g.publishedAt && ` · ${formatDate(g.publishedAt)}`} · {t("cms.guides.readingTime", { minutes: g.readingMinutes })}</p>
                <h2 className="t-h4 mt-1 group-hover:text-accent">{g.title}</h2>
                {g.excerpt && <p className="mt-1 line-clamp-3 text-sm text-muted">{g.excerpt}</p>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<BookOpen />} title={t("cms.guides.empty")} className="mt-8" />
      )}
    </Section>
  );
}
