"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useT } from "@/i18n/client";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { TR, TD } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogHeading, DialogText, DialogClose } from "@/components/ui/dialog";
import { inventoryAdjustAction, inventoryMovementsAction, type StockMovementRow } from "@/app/actions/admin/catalog";

const MOVEMENT_TYPES = ["RECEIPT", "ADJUSTMENT", "RETURN", "SALE", "RESERVATION", "RELEASE"] as const;

export interface InventoryRowData { variantId: string; productId: string; productName: string; sku: string; variantName: string | null; quantity: number; reserved: number; threshold: number; allowBackorder: boolean; isActive: boolean }
export type StockState = "ok" | "low" | "out";
const tone: Record<StockState, "success" | "warning" | "error"> = { ok: "success", low: "warning", out: "error" };

export function stockState(r: { quantity: number; reserved: number; threshold: number }): StockState {
  const available = r.quantity - r.reserved;
  if (available <= 0) return "out";
  return available <= r.threshold ? "low" : "ok";
}

/** Ligne de stock : état, ajustement (dialogue) et mouvements récents dépliables. */
export function InventoryRow({ row }: { row: InventoryRowData }) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [movements, setMovements] = React.useState<StockMovementRow[] | null>(null);
  const [pending, start] = React.useTransition();
  const state = stockState(row);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && movements === null) start(async () => { const r = await inventoryMovementsAction({ variantId: row.variantId }); setMovements(r.ok ? (r.data ?? []) : []); });
  };
  return (
    <>
      <TR className={!row.isActive ? "opacity-60" : undefined}>
        <TD><Link href={`/admin/products/${row.productId}`} className="font-medium hover:underline">{row.productName}</Link>{row.variantName && <span className="block text-xs text-muted">{row.variantName}</span>}</TD>
        <TD className="font-mono text-xs">{row.sku}</TD>
        <TD className="text-end font-semibold tnum">{row.quantity - row.reserved}</TD>
        <TD className="text-end text-muted tnum">{row.reserved}</TD>
        <TD className="text-end text-muted tnum">{row.threshold}</TD>
        <TD><Badge variant={tone[state]} size="sm">{t.enum("admin.inventory.status", state)}</Badge>{row.allowBackorder && <Badge variant="outline" size="sm" className="ms-1">{t("admin.inventory.backorder")}</Badge>}</TD>
        <TD>
          <span className="flex justify-end gap-1">
            <AdjustDialog row={row} />
            <Button size="sm" variant="ghost" onClick={toggle} aria-expanded={open}>{open ? <ChevronUp /> : <ChevronDown />}{open ? t("admin.inventory.hideMovements") : t("admin.inventory.showMovements")}</Button>
          </span>
        </TD>
      </TR>
      {open && (
        <TR className="bg-paper hover:bg-paper">
          <TD colSpan={7} className="py-2">
            {pending || movements === null ? <p className="text-xs text-muted">{t("common.labels.loading")}</p> : movements.length === 0 ? <p className="text-xs text-muted">{t("admin.inventory.noMovements")}</p> : (
              <table className="w-full text-xs">
                <thead className="text-muted"><tr><th className="py-1 text-start font-semibold">{t("admin.inventory.movementColumns.date")}</th><th className="py-1 text-start font-semibold">{t("admin.inventory.movementColumns.type")}</th><th className="py-1 text-end font-semibold">{t("admin.inventory.movementColumns.quantity")}</th><th className="py-1 text-start font-semibold ps-4">{t("admin.inventory.movementColumns.reason")}</th><th className="py-1 text-start font-semibold">{t("admin.inventory.movementColumns.user")}</th></tr></thead>
                <tbody>{movements.map((m) => <tr key={m.id} className="border-t border-border"><td className="py-1 whitespace-nowrap">{formatDateTime(m.createdAt)}</td><td className="py-1">{t.enum("admin.inventory.reasons", m.type)}</td><td className={`py-1 text-end font-semibold tnum ${m.quantity < 0 ? "text-error" : "text-success"}`}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td><td className="py-1 ps-4 text-muted">{m.reason ?? "—"}</td><td className="py-1 text-muted">{m.user ?? t("admin.audit.system")}</td></tr>)}</tbody>
              </table>
            )}
          </TD>
        </TR>
      )}
    </>
  );
}

function AdjustDialog({ row }: { row: InventoryRowData }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [quantity, setQuantity] = React.useState("");
  const [type, setType] = React.useState<(typeof MOVEMENT_TYPES)[number]>("ADJUSTMENT");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const delta = Number.parseInt(quantity, 10);
  const next = Number.isFinite(delta) ? row.quantity + delta : row.quantity;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(delta) || delta === 0) { setError(t("admin.inventory.quantityRequired")); return; }
    if (next < 0) { setError(t("admin.inventory.negativeBlocked")); return; }
    start(async () => {
      const r = await inventoryAdjustAction({ variantId: row.variantId, quantity: delta, type, reason });
      if (r.ok) { toast.success(r.message ?? ""); setOpen(false); setQuantity(""); setReason(""); setError(null); router.refresh(); }
      else setError(r.error);
    });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}><SlidersHorizontal />{t("admin.inventory.adjust")}</Button>
      <DialogContent size="sm" closeLabel={t("common.actions.close")}>
        <form onSubmit={submit}>
          <DialogHeader><DialogHeading>{t("admin.inventory.adjustTitle", { sku: row.sku })}</DialogHeading><DialogText>{row.productName}{row.variantName ? ` · ${row.variantName}` : ""}</DialogText></DialogHeader>
          <DialogBody className="space-y-3">
            <FormError message={error} />
            <Field id={`adj-q-${row.variantId}`} label={t("admin.inventory.adjustQuantity")} hint={t("admin.inventory.adjustHint")} required><Input type="number" step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus className="tnum" /></Field>
            <Field id={`adj-t-${row.variantId}`} label={t("admin.inventory.adjustReason")}><Select value={type} onChange={(e) => setType(e.target.value as (typeof MOVEMENT_TYPES)[number])}>{MOVEMENT_TYPES.map((ty) => <option key={ty} value={ty}>{t.enum("admin.inventory.reasons", ty)}</option>)}</Select></Field>
            <Field id={`adj-r-${row.variantId}`} label={t("admin.inventory.adjustNote")}><Input value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} /></Field>
            <p className={`text-sm font-medium ${next < 0 ? "text-error" : ""}`}>{t("admin.inventory.newQuantity", { count: next })}</p>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">{t("common.actions.cancel")}</Button></DialogClose>
            <Button type="submit" loading={pending} disabled={!quantity || next < 0}>{t("common.actions.confirm")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
