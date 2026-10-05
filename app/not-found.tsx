import Link from "next/link";
import { Search } from "lucide-react";
import { getT } from "@/i18n/server";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/layout/site-shell";
import { getCategoryTree } from "@/services/catalog/categories";

export default async function NotFound() {
  const t = await getT();
  const tree = await getCategoryTree().catch(() => []);
  return (
    <SiteShell>
      <div className="container-site py-16 md:py-24">
        <div className="mx-auto max-w-xl text-center">
          <p className="t-label text-muted">404</p>
          <h1 className="t-h1 mt-3">{t("cms.notFound.title")}</h1>
          <p className="mt-4 text-muted">{t("cms.notFound.desc")}</p>
          <form action="/search" method="get" className="mx-auto mt-8 flex max-w-md items-stretch overflow-hidden rounded-md border border-border-strong bg-surface">
            <input type="search" name="q" placeholder={t("cms.notFound.searchPlaceholder")} aria-label={t("common.actions.search")} className="h-12 flex-1 bg-transparent px-4 text-sm focus:outline-none" />
            <button type="submit" className="flex w-12 items-center justify-center bg-ink text-white" aria-label={t("common.actions.search")}>
              <Search className="size-4" />
            </button>
          </form>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href="/c">{t("cms.notFound.cta")}</Link>
            </Button>
          </div>
          {tree.length > 0 && (
            <div className="mt-12 border-t border-border pt-8">
              <p className="t-label text-muted">{t("cms.notFound.popular")}</p>
              <ul className="mt-4 flex flex-wrap justify-center gap-2">
                {tree.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <Link href={c.href} className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm hover:bg-paper-2">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
