import { getCurrentUser } from "@/lib/auth/dal";
import { getCategoryTree, type CategoryNode } from "@/services/catalog/categories";
import { getSectors } from "@/services/catalog/sectors";
import { getFeaturedBrands } from "@/services/catalog/brands";
import { getCartCount } from "@/services/cart";
import { getSettings } from "@/services/settings";
import { getT } from "@/i18n/server";
import { Header } from "./header";
import { Footer } from "./footer";
import { MobileNav } from "./mobile-nav";
import type { NavCategory, NavData, HeaderUser } from "./nav-types";

function toNav(node: CategoryNode, depth = 0): NavCategory {
  return {
    id: node.id,
    name: node.name,
    href: node.href,
    icon: node.icon,
    image: node.image,
    productCount: node.productCount,
    showInNav: node.showInNav,
    children: depth < 2 ? node.children.map((c) => toNav(c, depth + 1)) : [],
  };
}

export async function getNavData(): Promise<NavData> {
  const [tree, sectors, brands] = await Promise.all([getCategoryTree(), getSectors(), getFeaturedBrands(8)]);
  return {
    categories: tree.map((c) => toNav(c)),
    sectors: sectors.map((s) => ({ name: s.name, href: s.href, icon: s.icon })),
    brands: brands.map((b) => ({ name: b.name, href: b.href })),
  };
}

/** Coquille globale : en-tête, contenu, pied de page, navigation mobile. */
export async function SiteShell({ children, withMobileNav = true }: { children: React.ReactNode; withMobileNav?: boolean }) {
  const [user, nav, settings, t] = await Promise.all([getCurrentUser(), getNavData(), getSettings(), getT()]);
  const cartCount = await getCartCount(user);
  const headerUser: HeaderUser | null = user ? { firstName: user.firstName, businessName: user.business?.name ?? null, isStaff: user.isStaff } : null;
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        {t("common.skipToContent")}
      </a>
      <Header nav={nav} user={headerUser} cartCount={cartCount} announcement={settings.announcement} supportPhone={settings.supportPhone} />
      <main id="main" className={withMobileNav ? "flex-1 pb-16 md:pb-0" : "flex-1"}>
        {children}
      </main>
      <Footer settings={settings} />
      {withMobileNav && <MobileNav nav={nav} user={headerUser} cartCount={cartCount} />}
    </>
  );
}
