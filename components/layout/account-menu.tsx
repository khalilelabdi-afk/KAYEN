"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { User, Package, FileText, ListChecks, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { useT } from "@/i18n/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { HeaderUser } from "./nav-types";

export function AccountMenu({ user }: { user: HeaderUser | null }) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!user) {
    return (
      <Link href="/login" className="inline-flex h-10 items-center gap-2 rounded-md px-2.5 text-sm font-medium hover:bg-paper-2 md:px-3">
        <User className="size-5" aria-hidden />
        <span className="hidden lg:inline">{t("nav.header.login")}</span>
      </Link>
    );
  }

  const logout = () =>
    start(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-md px-2.5 text-sm font-medium hover:bg-paper-2 data-[state=open]:bg-paper-2 md:px-3" aria-label={t("nav.header.myAccount")}>
        <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{user.firstName.charAt(0).toUpperCase()}</span>
        <span className="hidden max-w-32 truncate lg:inline">{user.firstName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="truncate">
          {user.businessName ?? user.firstName}
        </DropdownMenuLabel>
        <DropdownMenuItem asChild><Link href="/account"><User />{t("account.nav.overview")}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/orders"><Package />{t("account.nav.orders")}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/quotes"><FileText />{t("account.nav.quotes")}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/lists"><ListChecks />{t("account.nav.lists")}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/settings"><Settings />{t("account.nav.settings")}</Link></DropdownMenuItem>
        {user.isStaff && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/admin"><LayoutDashboard />{t("admin.title")}</Link></DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout} disabled={pending}><LogOut />{t("common.actions.logout")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
