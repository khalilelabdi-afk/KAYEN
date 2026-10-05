import type { Metadata } from "next";
import Link from "next/link";
import { Layers, BadgePercent, Headset } from "lucide-react";
import { getT } from "@/i18n/server";
import { Section } from "@/components/layout/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("cms.about.title"), description: t("cms.about.subtitle"), alternates: { canonical: "/about" } };
}

export default async function AboutPage() {
  const t = await getT();
  const items = [
    { icon: Layers, title: t("cms.about.how.catalog.title"), desc: t("cms.about.how.catalog.desc") },
    { icon: BadgePercent, title: t("cms.about.how.pricing.title"), desc: t("cms.about.how.pricing.desc") },
    { icon: Headset, title: t("cms.about.how.service.title"), desc: t("cms.about.how.service.desc") },
  ];
  return (
    <Section className="py-6 md:py-10">
      <Breadcrumb items={[{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("cms.about.title") }]} label={t("common.breadcrumb.label")} className="mb-4" />
      <div className="max-w-3xl">
        <h1 className="t-h1">{t("cms.about.title")}</h1>
        <p className="t-body-lg mt-4 text-muted">{t("cms.about.subtitle")}</p>
      </div>
      <div className="mt-12 grid gap-10 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="t-h2">{t("cms.about.mission.title")}</h2>
          <p className="mt-4 text-muted">{t("cms.about.mission.desc")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link href="/contact">{t("cms.about.contactCta")}</Link></Button>
            <Button asChild variant="outline"><Link href="/quote">{t("cms.about.quoteCta")}</Link></Button>
          </div>
        </div>
        <div>
          <h2 className="t-h2">{t("cms.about.how.title")}</h2>
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
            {items.map((it) => (
              <li key={it.title} className="flex gap-4 p-5">
                <it.icon className="size-5 shrink-0 text-accent" aria-hidden />
                <div><p className="font-semibold">{it.title}</p><p className="mt-1 text-sm text-muted">{it.desc}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-12 rounded-lg border border-border bg-surface p-5 text-sm text-muted">
        <p className="font-semibold text-foreground">{t("cms.about.legalTitle")}</p>
        <p className="mt-1">{t("cms.about.legalDesc")} <Link href="/pages/mentions-legales" className="underline underline-offset-2">{t("cms.legal.title")}</Link>.</p>
      </div>
    </Section>
  );
}
