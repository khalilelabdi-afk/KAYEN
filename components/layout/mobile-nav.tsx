"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, User, ShoppingCart, ChevronRight, ChevronLeft, FileText, Package, ListChecks, LogIn, Phone } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { SearchBar } from "./search-bar";
import { CategoryIcon } from "./category-icon";
import type { NavData, NavCategory, HeaderUser } from "./nav-types";

/** Navigation mobile fixe : Accueil, Catégories, Recherche, Compte, Panier. */
export function MobileNav({ nav, user, cartCount }: { nav: NavData; user: HeaderUser | null; cartCount: number }) {
  const t = useT();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [lastPath, setLastPath] = React.useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  const item = "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted transition-colors";
  const activeCls = "text-ink";

  return (
    <>
      <nav aria-label={t("nav.header.menu")} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface safe-bottom md:hidden">
        <div className="flex h-14 items-stretch">
          <Link href="/" className={cn(item, pathname === "/" && activeCls)}>
            <Home className="size-5" aria-hidden />
            {t("nav.mobile.home")}
          </Link>
          <button type="button" onClick={() => setMenuOpen(true)} className={cn(item, (pathname.startsWith("/c") || menuOpen) && activeCls)}>
            <LayoutGrid className="size-5" aria-hidden />
            {t("nav.mobile.categories")}
          </button>
          <button type="button" onClick={() => setSearchOpen(true)} className={cn(item, pathname.startsWith("/search") && activeCls)}>
            <Search className="size-5" aria-hidden />
            {t("nav.mobile.search")}
          </button>
          <Link href={user ? "/account" : "/login"} className={cn(item, pathname.startsWith("/account") && activeCls)}>
            <User className="size-5" aria-hidden />
            {t("nav.mobile.account")}
          </Link>
          <Link href="/cart" className={cn(item, "relative", pathname.startsWith("/cart") && activeCls)}>
            <span className="relative">
              <ShoppingCart className="size-5" aria-hidden />
              {cartCount > 0 && (
                <span className="absolute -end-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white tnum">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </span>
            {t("nav.mobile.cart")}
          </Link>
        </div>
      </nav>

      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} nav={nav} user={user} />

      <Drawer open={searchOpen} onOpenChange={setSearchOpen}>
        <DrawerContent side="bottom" className="h-[92dvh] rounded-t-xl">
          <DrawerHeader>
            <DrawerTitle className="t-h4">{t("nav.mobile.search")}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <DrawerDescription className="sr-only">{t("catalog.search.typeToSearch")}</DrawerDescription>
            <SearchBar placeholder={t("nav.header.searchPlaceholderShort")} autoFocus onNavigate={() => setSearchOpen(false)} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function MobileMenu({ open, onOpenChange, nav, user }: { open: boolean; onOpenChange: (o: boolean) => void; nav: NavData; user: HeaderUser | null }) {
  const t = useT();
  const [stack, setStack] = React.useState<NavCategory[]>([]);
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setStack([]);
  }
  const current = stack[stack.length - 1] ?? null;
  const list = current ? current.children : nav.categories;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="left" width="max-w-sm">
        <DrawerHeader>
          {current ? (
            <button type="button" onClick={() => setStack((s) => s.slice(0, -1))} className="inline-flex items-center gap-1 text-sm font-medium">
              <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
              {t("nav.mobile.back")}
            </button>
          ) : (
            <DrawerTitle className="font-display text-lg font-extrabold tracking-tight">KAYEN</DrawerTitle>
          )}
        </DrawerHeader>
        <DrawerBody className="px-0 py-0">
          <DrawerDescription className="sr-only">{t("nav.megaMenu.title")}</DrawerDescription>
          {current && (
            <Link href={current.href} className="flex items-center justify-between border-b border-border bg-paper px-4 py-3 text-sm font-semibold">
              {t("nav.megaMenu.seeAllIn", { name: current.name })}
              <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
            </Link>
          )}
          <ul>
            {list.map((c) => (
              <li key={c.id} className="border-b border-border">
                {c.children.length > 0 ? (
                  <button type="button" onClick={() => setStack((s) => [...s, c])} className="flex w-full items-center gap-3 px-4 py-3.5 text-start text-sm font-medium">
                    {!current && <CategoryIcon icon={c.icon} className="size-4 text-muted" />}
                    <span className="flex-1">{c.name}</span>
                    <span className="text-xs text-subtle tnum">{c.productCount}</span>
                    <ChevronRight className="size-4 text-subtle rtl:rotate-180" aria-hidden />
                  </button>
                ) : (
                  <Link href={c.href} className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium">
                    {!current && <CategoryIcon icon={c.icon} className="size-4 text-muted" />}
                    <span className="flex-1">{c.name}</span>
                    <span className="text-xs text-subtle tnum">{c.productCount}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {!current && (
            <>
              <div className="border-b border-border px-4 py-3">
                <Link href="/promotions" className="block py-2 text-sm font-semibold text-accent">{t("nav.header.promotions")}</Link>
                <Link href="/nouveautes" className="block py-2 text-sm font-medium">{t("nav.header.newArrivals")}</Link>
                <Link href="/brands" className="block py-2 text-sm font-medium">{t("nav.header.brands")}</Link>
                <Link href="/quick-order" className="block py-2 text-sm font-medium">{t("nav.header.quickOrder")}</Link>
              </div>
              <div className="border-b border-border px-4 py-3">
                <p className="t-label mb-1 text-muted">{t("nav.header.sectors")}</p>
                {nav.sectors.map((s) => (
                  <Link key={s.href} href={s.href} className="flex items-center gap-2 py-2 text-sm">
                    <CategoryIcon icon={s.icon} className="size-4 text-muted" />
                    {s.name}
                  </Link>
                ))}
              </div>
              <div className="px-4 py-3">
                {user ? (
                  <>
                    <Link href="/account" className="flex items-center gap-2 py-2 text-sm"><User className="size-4 text-muted" />{t("nav.header.myAccount")}</Link>
                    <Link href="/account/orders" className="flex items-center gap-2 py-2 text-sm"><Package className="size-4 text-muted" />{t("nav.header.orders")}</Link>
                    <Link href="/account/lists" className="flex items-center gap-2 py-2 text-sm"><ListChecks className="size-4 text-muted" />{t("nav.header.lists")}</Link>
                  </>
                ) : (
                  <Link href="/login" className="flex items-center gap-2 py-2 text-sm"><LogIn className="size-4 text-muted" />{t("nav.header.login")}</Link>
                )}
                <Link href="/quote" className="flex items-center gap-2 py-2 text-sm"><FileText className="size-4 text-muted" />{t("nav.topbar.quote")}</Link>
                <Link href="/contact" className="flex items-center gap-2 py-2 text-sm"><Phone className="size-4 text-muted" />{t("nav.topbar.support")}</Link>
              </div>
            </>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
