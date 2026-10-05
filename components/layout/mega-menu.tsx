"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutGrid, ChevronRight, ArrowRight } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";
import type { NavData } from "./nav-types";

/**
 * Mega menu "Tous les produits" : colonne des grandes catégories, panneau des sous-catégories,
 * collections populaires (activités), marques et zone promotionnelle. Clavier + survol.
 */
export function MegaMenu({ nav }: { nav: NavData }) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(nav.categories[0]?.id ?? null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const closeTimer = React.useRef<number | null>(null);

  const active = nav.categories.find((c) => c.id === activeId) ?? nav.categories[0];

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  };
  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };

  return (
    <div ref={rootRef} className="relative me-2" onMouseLeave={scheduleClose} onMouseEnter={cancelClose}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md bg-ink px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-black",
          open && "bg-black",
        )}
      >
        <LayoutGrid className="size-4" aria-hidden />
        {t("nav.header.allProducts")}
      </button>

      {open && (
        <div className="absolute start-0 top-full z-50 pt-2" role="dialog" aria-label={t("nav.megaMenu.title")}>
          <div className="flex w-[min(1180px,calc(100vw-3rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-lg animate-fade-in">
            {/* Colonne catégories */}
            <ul className="w-64 shrink-0 border-e border-border bg-paper py-2" role="menu">
              {nav.categories.map((c) => (
                <li key={c.id} role="none">
                  <Link
                    href={c.href}
                    role="menuitem"
                    onMouseEnter={() => setActiveId(c.id)}
                    onFocus={() => setActiveId(c.id)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                      active?.id === c.id ? "bg-surface text-foreground" : "text-foreground/80 hover:bg-surface",
                    )}
                  >
                    <CategoryIcon icon={c.icon} className="size-4 text-muted" />
                    <span className="flex-1 truncate">{c.name}</span>
                    <ChevronRight className="size-3.5 text-subtle rtl:rotate-180" aria-hidden />
                  </Link>
                </li>
              ))}
              <li role="none" className="mt-2 border-t border-border px-4 pt-3">
                <Link href="/c" onClick={() => setOpen(false)} className="text-xs font-semibold text-muted hover:text-foreground">
                  {t("nav.megaMenu.allCategories")} →
                </Link>
              </li>
            </ul>

            {/* Panneau sous-catégories */}
            <div className="min-w-0 flex-1 p-6">
              {active && (
                <>
                  <div className="mb-4 flex items-baseline justify-between gap-4">
                    <h3 className="t-h4">{active.name}</h3>
                    <Link href={active.href} onClick={() => setOpen(false)} className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                      {t("nav.megaMenu.seeAllIn", { name: active.name })}
                      <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
                    </Link>
                  </div>
                  {active.children.length ? (
                    <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                      {active.children.filter((child) => child.productCount > 0).map((child) => (
                        <div key={child.id} className="min-w-0">
                          <Link href={child.href} onClick={() => setOpen(false)} className="block text-sm font-semibold hover:text-accent">
                            {child.name}
                            <span className="ms-1.5 text-xs font-normal text-subtle tnum">{child.productCount}</span>
                          </Link>
                          {child.children.length > 0 && (
                            <ul className="mt-1.5 space-y-1">
                              {child.children.filter((g) => g.productCount > 0).slice(0, 6).map((g) => (
                                <li key={g.id}>
                                  <Link href={g.href} onClick={() => setOpen(false)} className="text-[13px] text-muted hover:text-foreground">
                                    {g.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">{t("common.empty.title")}</p>
                  )}
                </>
              )}
            </div>

            {/* Colonne droite : activités, marques, promo */}
            <aside className="w-64 shrink-0 border-s border-border bg-paper p-5">
              <p className="t-label text-muted">{t("nav.megaMenu.sectorsTitle")}</p>
              <ul className="mt-2 space-y-1">
                {nav.sectors.slice(0, 6).map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} onClick={() => setOpen(false)} className="flex items-center gap-2 text-[13px] text-foreground/85 hover:text-foreground">
                      <CategoryIcon icon={s.icon} className="size-3.5 text-muted" />
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
              {nav.brands.length > 0 && (
                <>
                  <p className="t-label mt-5 text-muted">{t("nav.megaMenu.brands")}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {nav.brands.slice(0, 6).map((b) => (
                      <li key={b.href}>
                        <Link href={b.href} onClick={() => setOpen(false)} className="inline-flex rounded-sm border border-border bg-surface px-2 py-1 text-xs hover:border-ink">
                          {b.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href="/brands" onClick={() => setOpen(false)} className="mt-2 inline-block text-xs text-muted hover:text-foreground">
                    {t("nav.megaMenu.allBrands")} →
                  </Link>
                </>
              )}
              <Link href="/promotions" onClick={() => setOpen(false)} className="mt-5 block rounded-lg bg-accent p-4 text-white transition-colors hover:bg-accent-hover">
                <p className="text-sm font-semibold">{t("nav.megaMenu.promoTitle")}</p>
                <p className="mt-1 text-xs text-white/85">{t("nav.megaMenu.promoCta")} →</p>
              </Link>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
