"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, FileText, Receipt, ListChecks, MapPin, Users, Building2, Settings, Zap, LogOut } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";

const icons = { dashboard: LayoutDashboard, orders: Package, quotes: FileText, invoices: Receipt, lists: ListChecks, addresses: MapPin, users: Users, company: Building2, settings: Settings, quick: Zap } as const;

export function AccountNav({ items }: { items: { href: string; label: string; icon: keyof typeof icons }[] }) {
  const t = useT();
  const pathname = usePathname();
  return (
    <nav aria-label={t("account.title")} className="lg:sticky lg:top-32 lg:self-start">
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none lg:mx-0 lg:flex-col lg:px-0 lg:pb-0">
        {items.map((item) => {
          const Icon = icons[item.icon];
          const active = item.href === "/account" ? pathname === "/account" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link href={item.href} className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors", active ? "bg-ink text-white" : "text-foreground/80 hover:bg-paper-2 hover:text-foreground")}>
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-3 lg:border-t lg:border-border lg:pt-3">
          <form action={logoutAction}>
            <button type="submit" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-paper-2 hover:text-foreground"><LogOut className="size-4" aria-hidden />{t("account.nav.logout")}</button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
