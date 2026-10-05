import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getT } from "@/i18n/server";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { LogoMark } from "@/components/layout/logo";
import { AdminNav } from "./admin-nav";

export async function AdminShell({ children, title, actions, breadcrumb }: { children: React.ReactNode; title: string; actions?: React.ReactNode; breadcrumb?: { label: string; href?: string }[] }) {
  const [t, user] = await Promise.all([getT(), requireStaff()]);
  const [pendingQuotes, pendingBusinesses, pendingOrders, newMessages] = await Promise.all([
    db.quote.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
    db.business.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
  ]);
  const groups = [
    { title: t("admin.nav.sales"), items: [
      { href: "/admin", label: t("admin.nav.dashboard"), icon: "dashboard" as const, exact: true },
      { href: "/admin/orders", label: t("admin.nav.orders"), icon: "orders" as const, badge: pendingOrders },
      { href: "/admin/quotes", label: t("admin.nav.quotes"), icon: "quotes" as const, badge: pendingQuotes },
      { href: "/admin/customers", label: t("admin.nav.customers"), icon: "customers" as const, badge: pendingBusinesses },
      { href: "/admin/messages", label: t("admin.nav.messages"), icon: "messages" as const, badge: newMessages },
    ] },
    { title: t("admin.nav.catalog"), items: [
      { href: "/admin/products", label: t("admin.nav.products"), icon: "products" as const },
      { href: "/admin/categories", label: t("admin.nav.categories"), icon: "categories" as const },
      { href: "/admin/brands", label: t("admin.nav.brands"), icon: "brands" as const },
      { href: "/admin/inventory", label: t("admin.nav.inventory"), icon: "inventory" as const },
      { href: "/admin/promotions", label: t("admin.nav.promotions"), icon: "promotions" as const },
      { href: "/admin/imports", label: t("admin.nav.imports"), icon: "imports" as const },
    ] },
    { title: t("admin.nav.content"), items: [
      { href: "/admin/homepage", label: t("admin.nav.homepage"), icon: "homepage" as const },
      { href: "/admin/sectors", label: t("admin.nav.sectors"), icon: "sectors" as const },
      { href: "/admin/pages", label: t("admin.nav.pages"), icon: "pages" as const },
      { href: "/admin/guides", label: t("admin.nav.guides"), icon: "guides" as const },
      { href: "/admin/faq", label: t("admin.nav.faq"), icon: "faq" as const },
    ] },
    { title: t("admin.nav.system"), items: [
      { href: "/admin/settings", label: t("admin.nav.settings"), icon: "settings" as const },
      { href: "/admin/audit", label: t("admin.nav.audit"), icon: "audit" as const },
    ] },
  ];
  return (
    <div className="flex min-h-full flex-1 bg-paper">
      <aside className="hidden w-60 shrink-0 border-e border-border bg-surface lg:block">
        <div className="sticky top-0 flex h-dvh flex-col">
          <div className="flex h-14 items-center justify-between border-b border-border px-4"><Link href="/admin" aria-label={t("admin.title")}><LogoMark className="text-xl" /></Link><span className="t-label text-muted">Admin</span></div>
          <div className="flex-1 overflow-y-auto px-2 py-3"><AdminNav groups={groups} /></div>
          <div className="border-t border-border px-4 py-3 text-xs text-muted"><p className="truncate font-medium text-foreground">{user.fullName}</p><Link href="/" className="mt-1 inline-flex items-center gap-1 hover:text-foreground"><ExternalLink className="size-3" />{t("admin.nav.backToSite")}</Link></div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between px-4"><Link href="/admin"><LogoMark className="text-xl" /></Link><AdminNav groups={groups} mobile /></div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {breadcrumb && (
            <nav className="mb-2 text-xs text-muted"><ol className="flex flex-wrap gap-1">{breadcrumb.map((b, i) => <li key={i} className="flex gap-1">{i > 0 && <span>/</span>}{b.href ? <Link href={b.href} className="hover:text-foreground">{b.label}</Link> : <span className="text-foreground">{b.label}</span>}</li>)}</ol></nav>
          )}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="t-h2">{title}</h1>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>
          {children}
        </main>
      </div>
    </div>
  );
}
