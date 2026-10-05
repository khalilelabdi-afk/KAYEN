import Link from "next/link";
import Image from "next/image";
import { getT } from "@/i18n/server";
import { Section, SectionHeader } from "@/components/layout/section";
import type { CategoryNode } from "@/services/catalog/categories";

export async function CategoriesSection({ categories, title, subtitle, limit = 12 }: { categories: CategoryNode[]; title?: string | null; subtitle?: string | null; limit?: number }) {
  const t = await getT();
  if (!categories.length) return null;
  return (
    <Section bordered className="bg-surface">
      <SectionHeader title={title ?? t("home.categories.title")} subtitle={subtitle ?? t("home.categories.subtitle")} cta={{ label: t("home.categories.cta"), href: "/c" }} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.slice(0, limit).map((c) => (
          <li key={c.id}>
            <Link href={c.href} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-paper-2">
                <Image src={c.image ?? `/images/categories/${c.slug}.svg`} alt={c.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              </div>
              <p className="mt-2 text-sm font-semibold group-hover:text-accent">{c.name}</p>
              <p className="text-xs text-muted">{t("home.categories.productsCount", { count: c.productCount })}</p>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
