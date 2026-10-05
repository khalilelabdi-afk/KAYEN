import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getT } from "@/i18n/server";
import { getBrands } from "@/services/catalog/brands";
import { Section } from "@/components/layout/section";
import { CatalogPageHeader } from "@/components/catalog/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("catalog.brands.title"), description: t("catalog.brands.desc"), alternates: { canonical: "/brands" } };
}

export default async function BrandsPage() {
  const [t, brands] = await Promise.all([getT(), getBrands()]);
  const featured = brands.filter((b) => b.isFeatured);
  const groups = new Map<string, typeof brands>();
  for (const b of brands) {
    const letter = b.name.charAt(0).toUpperCase();
    groups.set(letter, [...(groups.get(letter) ?? []), b]);
  }
  return (
    <Section className="py-6 md:py-10">
      <CatalogPageHeader crumbs={[{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("catalog.brands.title") }]} breadcrumbLabel={t("common.breadcrumb.label")} title={t("catalog.brands.title")} description={t("catalog.brands.desc")} />
      {featured.length > 0 && (
        <div className="mb-10">
          <h2 className="t-label mb-4 text-muted">{t("catalog.brands.featured")}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {featured.map((b) => (
              <li key={b.id}>
                <Link href={b.href} className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface p-4 text-center transition-colors hover:border-ink">
                  {b.logo ? <Image src={b.logo} alt={b.name} width={240} height={120} className="h-14 w-auto object-contain" /> : <span className="font-display text-lg font-extrabold">{b.name}</span>}
                  <span className="text-xs text-muted">{t("catalog.brands.productsCount", { count: b.productCount })}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <h2 className="t-label mb-4 text-muted">{t("catalog.brands.allBrands")}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([letter, list]) => (
          <div key={letter}>
            <p className="font-display text-xl font-bold">{letter}</p>
            <ul className="mt-2 space-y-1.5">
              {list.map((b) => (
                <li key={b.id}>
                  <Link href={b.href} className="flex items-center justify-between gap-2 text-sm hover:text-accent">
                    <span>{b.name}</span>
                    <span className="text-xs text-subtle tnum">{b.productCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
