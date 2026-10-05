"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogHeading, DialogText } from "@/components/ui/dialog";
import { reorderAction } from "@/app/actions/account";
import type { ReorderResult } from "@/services/orders";
import { formatMoney } from "@/lib/money";
import { track } from "@/lib/analytics";

export function ReorderButton({ orderId, label, size = "md", variant = "primary", icon, fullWidth }: { orderId: string; label: string; size?: "sm" | "md" | "lg"; variant?: "primary" | "outline" | "secondary"; icon?: React.ReactNode; fullWidth?: boolean }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [result, setResult] = React.useState<ReorderResult | null>(null);
  const run = () =>
    start(async () => {
      const res = await reorderAction({ orderId });
      if (!res.ok) return toast.error(res.error);
      track({ name: "reorder", params: { order_id: orderId, items: res.data?.added.length ?? 0 } });
      const r = res.data!;
      if (r.unavailable.length || r.priceChanged.length || r.moqChanged.length) setResult(r);
      else { toast.success(res.message ?? "", { action: { label: t("cart.drawer.viewCart"), href: "/cart" } }); }
    });
  return (
    <>
      <Button size={size} variant={variant} onClick={run} loading={pending} fullWidth={fullWidth}>{icon}{label}</Button>
      <Dialog open={!!result} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent closeLabel={t("common.actions.close")}>
          <DialogHeader><DialogHeading>{t("account.orders.reorderResult.title")}</DialogHeading><DialogText>{t.plural("account.orders.reorderResult.added", result?.added.length ?? 0)}</DialogText></DialogHeader>
          <DialogBody>
            <ul className="space-y-1.5 text-sm">
              {result?.unavailable.map((n) => <li key={n} className="text-error">{t("account.orders.reorderResult.unavailable", { name: n })}</li>)}
              {result?.priceChanged.map((p) => <li key={p.name} className="text-warning">{t("account.orders.reorderResult.priceChanged", { name: p.name, old: formatMoney(p.old), new: formatMoney(p.new) })}</li>)}
              {result?.moqChanged.map((m) => <li key={m.name} className="text-warning">{t("account.orders.reorderResult.moqChanged", { name: m.name, quantity: m.quantity, min: m.min })}</li>)}
            </ul>
          </DialogBody>
          <DialogFooter><Button variant="outline" onClick={() => setResult(null)}>{t("common.actions.close")}</Button><Button onClick={() => router.push("/cart")}>{t("account.orders.reorderResult.viewCart")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
