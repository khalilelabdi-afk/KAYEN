import Link from "next/link";
import { Breadcrumb, type Crumb } from "@/components/ui/breadcrumb";
import { CategoryIcon } from "@/components/layout/category-icon";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import type { CategoryNode } from "@/services/catalog/categories";

/** En-tête de page catalogue : fil d'Ariane, H1, description, sous-catégories. */
export function CatalogPageHeader({ crumbs, breadcrumbLabel, title, description, subcategories, subcategoriesLabel, countLabel, children }: { crumbs: Crumb[]; breadcrumbLabel: string; title: string; description?: string | null; subcategories?: CategoryNode[]; subcategoriesLabel?: string; countLabel?: (n: number) => string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 md:mb-8">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumb items={crumbs} label={breadcrumbLabel} className="mb-4" />
      <div className="max-w-3xl">
        <h1 className="t-h1">{title}</h1>
        {description && <p className="mt-3 text-sm text-muted md:text-base">{description}</p>}
      </div>
      {children}
      {subcategories && subcategories.length > 0 && (
        <nav aria-label={subcategoriesLabel} className="mt-6">
          <ul className="flex gap-3 overflow-x-auto pb-2 scrollbar-none md:grid md:grid-cols-4 md:overflow-visible lg:grid-cols-6">
            {subcategories.map((c) => (
              <li key={c.id} className="w-40 shrink-0 md:w-auto">
                <Link href={c.href} className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-2 transition-colors hover:border-ink">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-accent-softer text-accent">
                    <CategoryIcon icon={c.icon} className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium group-hover:text-accent">{c.name}</span>
                    {countLabel && <span className="block text-xs text-muted">{countLabel(c.productCount)}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
