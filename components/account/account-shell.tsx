import { getT } from "@/i18n/server";
import type { CurrentUser } from "@/lib/auth/dal";
import { AccountNav } from "./account-nav";
import { Alert } from "@/components/ui/alert";

export async function AccountShell({ user, title, children, actions }: { user: CurrentUser; title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  const t = await getT();
  const items: { href: string; label: string; icon: "dashboard" | "orders" | "quotes" | "invoices" | "lists" | "quick" | "addresses" | "users" | "company" | "settings" }[] = [
    { href: "/account", label: t("account.nav.overview"), icon: "dashboard" },
    { href: "/account/orders", label: t("account.nav.orders"), icon: "orders" },
    { href: "/account/quotes", label: t("account.nav.quotes"), icon: "quotes" },
    { href: "/account/invoices", label: t("account.nav.invoices"), icon: "invoices" },
    { href: "/account/lists", label: t("account.nav.lists"), icon: "lists" },
    { href: "/quick-order", label: t("account.nav.quickOrder"), icon: "quick" },
    { href: "/account/addresses", label: t("account.nav.addresses"), icon: "addresses" },
    { href: "/account/users", label: t("account.nav.users"), icon: "users" },
    { href: "/account/company", label: t("account.nav.company"), icon: "company" },
    { href: "/account/settings", label: t("account.nav.settings"), icon: "settings" },
  ];
  return (
    <div className="container-site py-6 md:py-10">
      <div className="mb-6 md:mb-8">
        <p className="t-label text-muted">{user.business?.name ?? t("account.title")}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="t-h1">{title}</h1>
          {actions}
        </div>
      </div>
      {user.business?.status === "PENDING" && <Alert tone="info" className="mb-6">{t("account.overview.pendingNotice")}</Alert>}
      {user.business?.status === "SUSPENDED" && <Alert tone="error" className="mb-6">{t("account.overview.suspendedNotice")}</Alert>}
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <AccountNav items={items} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
