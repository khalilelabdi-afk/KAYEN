import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FileText } from "lucide-react";
import { getT } from "@/i18n/server";
import { Button } from "@/components/ui/button";
import type { NavCategory } from "@/components/layout/nav-types";

/** Hero : proposition de valeur + composition de familles de produits (liens vers les catégories racines). */
export async function Hero({ categories, title, subtitle }: { categories: NavCategory[]; title?: string | null; subtitle?: string | null }) {
  const t = await getT();
  const tiles = categories.slice(0, 6).map((c, i) => ({ ...c, image: c.image ?? `/images/site/hero-${i + 1}.svg` }));
  return (
    <section className="border-b border-border bg-surface">
      <div className="container-site grid items-center gap-8 py-10 md:grid-cols-[1.05fr_1fr] md:gap-12 md:py-16 lg:py-20">
        <div className="max-w-xl">
          <p className="t-label text-accent">{t("home.hero.eyebrow")}</p>
          <h1 className="t-display mt-4 text-balance">{title ?? t("home.hero.title")}</h1>
          <p className="t-body-lg mt-5 max-w-lg text-muted">{subtitle ?? t("home.hero.subtitle")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/c">
                {t("home.hero.ctaPrimary")}
                <ArrowRight className="rtl:rotate-180" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/quote">
                <FileText />
                {t("home.hero.ctaSecondary")}
              </Link>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent" aria-hidden />{t("home.hero.badges.catalog")}</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent" aria-hidden />{t("home.hero.badges.pricing")}</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent" aria-hidden />{t("home.hero.badges.quote")}</li>
          </ul>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 scrollbar-none md:mx-0 md:overflow-visible md:px-0">
          <ul className="flex w-max gap-3 md:grid md:w-auto md:grid-cols-3 md:gap-3">
            {tiles.map((c, i) => (
              <li key={c.id} className={i === 0 ? "md:col-span-2 md:row-span-2" : ""}>
                <Link href={c.href} className="group relative block aspect-square w-36 overflow-hidden rounded-lg border border-border bg-paper-2 md:w-auto md:h-full">
                  <Image src={c.image} alt={c.name} fill sizes="(max-width: 768px) 144px, (max-width: 1280px) 30vw, 300px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading={i < 3 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : undefined} />
                  <span className="absolute inset-x-2 bottom-2 inline-flex w-max max-w-[calc(100%-1rem)] items-center gap-1 rounded-sm bg-surface/95 px-2 py-1 text-xs font-semibold shadow-xs">
                    {c.name}
                    <ArrowRight className="size-3 rtl:rotate-180" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
