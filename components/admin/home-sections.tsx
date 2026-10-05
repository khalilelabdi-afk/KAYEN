"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { homeSectionsInitAction, homeSectionToggleAction, homeSectionMoveAction, homeSectionDeleteAction } from "@/app/actions/admin/content";
import { HomeSectionDialog, type HomeSectionRow } from "./home-section-dialog";

export function HomeInitButton() {
  const t = useT();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  return <Button loading={pending} onClick={() => start(async () => { const r = await homeSectionsInitAction(); if (r.ok) toast.success(r.message ?? ""); else toast.error(r.error); })}>{t("admin.cms.homepage.init")}</Button>;
}

function describeConfig(s: HomeSectionRow, labels: { limit: string; variant: string }): string {
  const parts: string[] = [];
  if (s.config.limit) parts.push(`${labels.limit} : ${s.config.limit}`);
  if (s.config.productSkus?.length) parts.push(s.config.productSkus.join(", "));
  if (s.config.categorySlugs?.length) parts.push(s.config.categorySlugs.join(", "));
  if (s.config.variant) parts.push(`${labels.variant} : ${s.config.variant}`);
  return parts.join(" · ");
}

export function HomeSectionsList({ sections }: { sections: HomeSectionRow[] }) {
  const t = useT();
  const toast = useToast();
  const [editing, setEditing] = React.useState<HomeSectionRow | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [, start] = React.useTransition();
  const run = (id: string, fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => { setBusy(id); start(async () => { const r = await fn(); if (!r.ok) toast.error(r.error ?? ""); else if (r.message) toast.success(r.message); setBusy(null); }); };
  const labels = { limit: t("admin.cms.homepage.limit"), variant: t("admin.cms.homepage.variant") };
  return (
    <>
      <ol className="divide-y divide-border rounded-lg border border-border bg-surface">
        {sections.map((s, i) => {
          const detail = describeConfig(s, labels);
          return (
            <li key={s.id} className={cn("flex flex-wrap items-center gap-3 px-4 py-3", !s.isActive && "opacity-60")}>
              <div className="flex flex-col gap-0.5">
                <IconButton label={t("admin.cms.homepage.moveUp")} size="icon-sm" disabled={i === 0 || busy === s.id} onClick={() => run(s.id, () => homeSectionMoveAction({ id: s.id, direction: "up" }))}><ArrowUp /></IconButton>
                <IconButton label={t("admin.cms.homepage.moveDown")} size="icon-sm" disabled={i === sections.length - 1 || busy === s.id} onClick={() => run(s.id, () => homeSectionMoveAction({ id: s.id, direction: "down" }))}><ArrowDown /></IconButton>
              </div>
              <span className="w-6 text-center text-xs text-muted tnum">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{t.enum("admin.cms.homepage.sectionTypes", s.type)}</Badge>
                  <span className="truncate text-sm font-medium">{s.title ?? <span className="text-muted">{t("admin.cms.homepage.titleField")} —</span>}</span>
                  {!s.isActive && <Badge variant="muted">{t("admin.cms.homepage.inactive")}</Badge>}
                </div>
                {(s.subtitle || detail || s.ctaHref) && <p className="mt-0.5 truncate text-xs text-muted">{[s.subtitle, detail, s.ctaHref].filter(Boolean).join(" · ")}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Switch aria-label={t("admin.cms.homepage.isActive")} checked={s.isActive} disabled={busy === s.id} onCheckedChange={(c) => run(s.id, () => homeSectionToggleAction({ id: s.id, isActive: c }))} />
                <IconButton label={t("common.actions.edit")} size="icon-sm" onClick={() => setEditing(s)}><Pencil /></IconButton>
                <IconButton label={t("common.actions.delete")} size="icon-sm" className="text-error hover:bg-error-soft" disabled={busy === s.id} onClick={() => { if (window.confirm(t("admin.cms.homepage.deleteConfirm"))) run(s.id, () => homeSectionDeleteAction({ id: s.id })); }}><Trash2 /></IconButton>
              </div>
            </li>
          );
        })}
      </ol>
      <HomeSectionDialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null); }} section={editing ?? undefined} />
    </>
  );
}
