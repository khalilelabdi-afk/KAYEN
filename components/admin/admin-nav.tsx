"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, FileText, Users, Mail, Boxes, FolderTree, Tag, Warehouse, BadgePercent, Upload, Home, Briefcase, FileCode, BookOpen, HelpCircle, Settings, ScrollText, Menu } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

const icons = { dashboard: LayoutDashboard, orders: Package, quotes: FileText, customers: Users, messages: Mail, products: Boxes, categories: FolderTree, brands: Tag, inventory: Warehouse, promotions: BadgePercent, imports: Upload, homepage: Home, sectors: Briefcase, pages: FileCode, guides: BookOpen, faq: HelpCircle, settings: Settings, audit: ScrollText } as const;

export interface AdminNavGroup { title: string; items: { href: string; label: string; icon: keyof typeof icons; badge?: number; exact?: boolean }[] }

function NavList({ groups, onNavigate }: { groups: AdminNavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="t-label mb-1.5 px-2 text-muted">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const Icon = icons[item.icon];
              const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={onNavigate} className={cn("flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors", active ? "bg-ink text-white" : "text-foreground/80 hover:bg-paper-2 hover:text-foreground")}>
                    <Icon className="size-4" aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? <span className={cn("rounded-full px-1.5 text-[10px] font-bold tnum", active ? "bg-white/20" : "bg-accent text-white")}>{item.badge}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function AdminNav({ groups, mobile = false }: { groups: AdminNavGroup[]; mobile?: boolean }) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  if (!mobile) return <NavList groups={groups} />;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex size-10 items-center justify-center rounded-md hover:bg-paper-2" aria-label={t("common.actions.openMenu")}><Menu className="size-5" /></button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent side="left" width="max-w-xs">
          <DrawerHeader><DrawerTitle className="t-h4">{t("admin.title")}</DrawerTitle></DrawerHeader>
          <DrawerBody><DrawerDescription className="sr-only">{t("admin.title")}</DrawerDescription><NavList groups={groups} onNavigate={() => setOpen(false)} /></DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
