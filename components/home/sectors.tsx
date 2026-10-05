import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getT } from "@/i18n/server";
import { Section, SectionHeader } from "@/components/layout/section";
import type { SectorSummary } from "@/services/catalog/sectors";

export async function SectorsSection({ sectors, title, subtitle, limit = 8 }: { sectors: SectorSummary[]; title?: string | null; subtitle?: string | null; limit?: number }) {
  const t = await getT();
  if (!sectors.length) return null;
  return (
    <Section>
      <SectionHeader title={title ?? t("home.sectors.title")} subtitle={subtitle ?? t("home.sectors.subtitle")} cta={{ label: t("home.sectors.cta"), href: "/professionnels" }} />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {sectors.slice(0, limit).map((s) => (
          <li key={s.id}>
            <Link href={s.href} className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md">
              <div className="relative aspect-[16/10] bg-paper-2">
                <Image src={s.image ?? `/images/sectors/${s.slug}.svg`} alt={s.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              </div>
              <div className="flex flex-1 items-start justify-between gap-2 p-3.5">
                <div className="min-w-0">
                  <p className="font-semibold">{s.name}</p>
                  {s.heroSubtitle && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{s.heroSubtitle}</p>}
                </div>
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-subtle transition-colors group-hover:text-accent rtl:rotate-180" aria-hidden />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
