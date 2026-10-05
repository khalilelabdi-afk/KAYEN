import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FileText, UserPlus } from "lucide-react";
import { getT } from "@/i18n/server";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/layout/section";
import type { BrandSummary } from "@/services/catalog/brands";
import type { GuideSummary } from "@/services/cms";
import { formatDate } from "@/lib/utils";

export async function QuoteBanner({ title, subtitle, ctaLabel, ctaHref, variant }: { title?: string | null; subtitle?: string | null; ctaLabel?: string | null; ctaHref?: string | null; variant?: string }) {
  const t = await getT();
  const isAccount = variant === "account";
  return (
    <section className="container-site py-6 md:py-10">
      <div className={isAccount ? "rounded-xl border border-border bg-surface px-6 py-8 md:px-10 md:py-12" : "rounded-xl bg-accent px-6 py-8 text-white md:px-10 md:py-12"}>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="t-h2">{title ?? (isAccount ? t("home.accountBanner.title") : t("home.quoteBanner.title"))}</h2>
            <p className={isAccount ? "mt-2 text-muted" : "mt-2 text-white/85"}>{subtitle ?? (isAccount ? t("home.accountBanner.desc") : t("home.quoteBanner.desc"))}</p>
          </div>
          <Button asChild size="lg" variant={isAccount ? "primary" : "secondary"} className={isAccount ? "" : "bg-white text-ink hover:bg-paper"}>
            <Link href={ctaHref ?? (isAccount ? "/register" : "/quote")}>
              {isAccount ? <UserPlus /> : <FileText />}
              {ctaLabel ?? (isAccount ? t("home.accountBanner.cta") : t("home.quoteBanner.cta"))}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export async function BrandsStrip({ brands, title }: { brands: BrandSummary[]; title?: string | null }) {
  const t = await getT();
  if (!brands.length) return null;
  return (
    <Section bordered>
      <SectionHeader title={title ?? t("home.brands.title")} cta={{ label: t("home.brands.cta"), href: "/brands" }} className="mb-5" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {brands.map((b) => (
          <li key={b.id}>
            <Link href={b.href} className="flex h-24 items-center justify-center rounded-lg border border-border bg-surface px-4 transition-colors hover:border-ink" title={b.name}>
              {b.logo ? (
                <Image src={b.logo} alt={b.name} width={240} height={120} className="h-16 w-auto object-contain" />
              ) : (
                <span className="font-display text-base font-extrabold tracking-tight">{b.name}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export async function GuidesSection({ guides, title }: { guides: GuideSummary[]; title?: string | null }) {
  const t = await getT();
  if (!guides.length) return null;
  return (
    <Section bordered>
      <SectionHeader title={title ?? t("home.guides.title")} cta={{ label: t("home.guides.cta"), href: "/guides" }} />
      <ul className="grid gap-4 md:grid-cols-3">
        {guides.map((g) => (
          <li key={g.id}>
            <Link href={g.href} className="group block">
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border bg-paper-2">
                {g.image && <Image src={g.image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />}
              </div>
              <p className="mt-3 text-xs text-muted">
                {g.category?.name}
                {g.publishedAt && ` · ${formatDate(g.publishedAt)}`} · {t("cms.guides.readingTime", { minutes: g.readingMinutes })}
              </p>
              <h3 className="t-h4 mt-1 group-hover:text-accent">{g.title}</h3>
              {g.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted">{g.excerpt}</p>}
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold">{t("common.actions.seeMore")}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
