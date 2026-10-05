import Link from "next/link";
import { Phone, FileText, Truck, Percent, ShoppingCart, ListChecks } from "lucide-react";
import { getT } from "@/i18n/server";
import { Logo } from "./logo";
import { SearchBar } from "./search-bar";
import { MegaMenu } from "./mega-menu";
import { AccountMenu } from "./account-menu";
import type { NavData, HeaderUser } from "./nav-types";
import { cn } from "@/lib/utils";

export async function Header({ nav, user, cartCount, announcement, supportPhone }: { nav: NavData; user: HeaderUser | null; cartCount: number; announcement: string; supportPhone: string }) {
  const t = await getT();
  const navCategories = (nav.categories.some((c) => c.showInNav) ? nav.categories.filter((c) => c.showInNav) : nav.categories).slice(0, 8);
  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/90">
      {/* Barre supérieure */}
      <div className="hidden border-b border-border bg-ink text-white md:block">
        <div className="container-site flex h-9 items-center justify-between text-xs">
          <ul className="flex items-center gap-6 text-white/85">
            <li className="flex items-center gap-1.5"><Truck className="size-3.5" aria-hidden />{t("nav.topbar.delivery")}</li>
            <li className="flex items-center gap-1.5"><Percent className="size-3.5" aria-hidden />{t("nav.topbar.degressive")}</li>
            {announcement && <li className="text-accent-soft">{announcement}</li>}
          </ul>
          <ul className="flex items-center gap-6">
            <li>
              <a href={`tel:${supportPhone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-white/85 hover:text-white">
                <Phone className="size-3.5" aria-hidden />{t("nav.topbar.support")} · {supportPhone}
              </a>
            </li>
            <li>
              <Link href="/quote" className="flex items-center gap-1.5 font-medium hover:text-accent-soft">
                <FileText className="size-3.5" aria-hidden />{t("nav.topbar.quote")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Barre principale */}
      <div className="border-b border-border">
        <div className="container-site flex h-16 items-center gap-3 md:h-[72px] md:gap-6">
          <Logo className="shrink-0" />
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchBar placeholder={t("nav.header.searchPlaceholder")} />
          </div>
          <div className="ms-auto flex items-center gap-1 md:gap-2">
            <AccountMenu user={user} />
            {user && (
              <Link href="/account/lists" className="hidden h-10 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-paper-2 lg:inline-flex">
                <ListChecks className="size-5" aria-hidden />
                <span>{t("nav.header.lists")}</span>
              </Link>
            )}
            <Link
              href="/cart"
              className="relative inline-flex h-10 items-center gap-2 rounded-md px-2.5 text-sm font-medium hover:bg-paper-2 md:px-3"
              aria-label={t("nav.header.cartWithCount", { count: cartCount })}
            >
              <ShoppingCart className="size-5" aria-hidden />
              <span className="hidden lg:inline">{t("nav.header.cart")}</span>
              {cartCount > 0 && (
                <span className="absolute -end-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white tnum lg:static lg:ms-0.5">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
        <div className="container-site pb-3 md:hidden">
          <SearchBar placeholder={t("nav.header.searchPlaceholderShort")} compact />
        </div>
      </div>

      {/* Navigation catégories (desktop) */}
      <nav aria-label={t("nav.header.menu")} className="hidden border-b border-border bg-surface md:block">
        <div className="container-site flex h-11 items-center gap-1">
          <MegaMenu nav={nav} />
          <ul className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto scrollbar-none">
            {navCategories.map((c) => (
              <li key={c.id} className="shrink-0">
                <Link href={c.href} className="inline-flex h-9 items-center rounded-md px-3 text-[13px] font-medium text-foreground/90 transition-colors hover:bg-paper-2 hover:text-foreground">
                  {c.name}
                </Link>
              </li>
            ))}
            <li className="shrink-0">
              <Link href="/promotions" className={cn("inline-flex h-9 items-center rounded-md px-3 text-[13px] font-semibold text-accent transition-colors hover:bg-accent-softer")}>
                {t("nav.header.promotions")}
              </Link>
            </li>
            <li className="shrink-0">
              <Link href="/nouveautes" className="inline-flex h-9 items-center rounded-md px-3 text-[13px] font-medium text-foreground/90 transition-colors hover:bg-paper-2">
                {t("nav.header.newArrivals")}
              </Link>
            </li>
          </ul>
          <Link href="/quick-order" className="hidden shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-muted hover:bg-paper-2 hover:text-foreground xl:inline-flex">
            {t("nav.header.quickOrder")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
