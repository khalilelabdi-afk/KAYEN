"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { Switch } from "@/components/ui/checkbox";
import { Button, IconButton } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { promotionToggleAction, promotionDeleteAction } from "@/app/actions/admin/promotions";

/** Interrupteur actif / inactif d'une promotion (liste). */
export function PromotionToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const t = useT();
  const toast = useToast();
  const [checked, setChecked] = React.useState(isActive);
  const [pending, start] = React.useTransition();
  return (
    <Switch checked={checked} disabled={pending} aria-label={t("admin.promotions.form.isActive")} onCheckedChange={(c) => { setChecked(c); start(async () => { const r = await promotionToggleAction({ id, isActive: c }); if (r.ok) toast.success(r.message ?? ""); else { setChecked(!c); toast.error(r.error); } }); }} />
  );
}

export function PromotionDeleteButton({ id, icon }: { id: string; icon?: boolean }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const run = () => {
    if (!window.confirm(t("admin.promotions.form.deleteConfirm"))) return;
    start(async () => { const r = await promotionDeleteAction({ id }); if (r.ok) { toast.success(r.message ?? ""); if (icon) router.refresh(); else router.push("/admin/promotions"); } else toast.error(r.error); });
  };
  if (icon) return <IconButton size="icon-sm" label={t("common.actions.delete")} disabled={pending} onClick={run}><Trash2 /></IconButton>;
  return <Button size="sm" variant="danger-outline" loading={pending} onClick={run}><Trash2 />{t("common.actions.delete")}</Button>;
}
