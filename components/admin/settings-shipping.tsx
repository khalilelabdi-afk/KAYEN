"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { formatMoney, parseMoneyInput, toMoneyInput } from "@/lib/money";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { Switch } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogHeading } from "@/components/ui/dialog";
import { shippingMethodSaveAction, shippingMethodDeleteAction } from "@/app/actions/admin/settings";

export interface ShippingMethodRow { id: string; code: string; name: string; description: string | null; price: number; freeAbove: number | null; minDays: number; maxDays: number; countryCodes: string[]; isActive: boolean; sortOrder: number }

const toForm = (m?: ShippingMethodRow) => ({ code: m?.code ?? "", name: m?.name ?? "", description: m?.description ?? "", price: m ? toMoneyInput(m.price) : "", freeAbove: m?.freeAbove !== null && m?.freeAbove !== undefined ? toMoneyInput(m.freeAbove) : "", minDays: String(m?.minDays ?? 2), maxDays: String(m?.maxDays ?? 5), countryCodes: m?.countryCodes.join(", ") ?? "", isActive: m?.isActive ?? true, sortOrder: String(m?.sortOrder ?? 0) });

/** Le contenu est démonté à la fermeture : l'état repart des props à chaque ouverture. */
function ShippingForm({ method, onClose }: { method?: ShippingMethodRow; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const [form, setForm] = React.useState(() => toForm(method));
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string[]>>({});
  const [pending, start] = React.useTransition();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await shippingMethodSaveAction({ id: method?.id, code: form.code, name: form.name, description: form.description, price: parseMoneyInput(form.price) ?? Number.NaN, freeAbove: form.freeAbove.trim() ? (parseMoneyInput(form.freeAbove) ?? Number.NaN) : null, minDays: Number(form.minDays), maxDays: Number(form.maxDays), countryCodes: form.countryCodes, isActive: form.isActive, sortOrder: Number(form.sortOrder) });
      if (r.ok) { toast.success(r.message ?? ""); onClose(); } else { setError(r.error); setFe(r.fieldErrors ?? {}); }
    });
  };
  return (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader><DialogHeading>{method ? t("admin.settings.shipping.edit") : t("admin.settings.shipping.add")}</DialogHeading></DialogHeader>
          <DialogBody className="space-y-3">
            <FormError message={error} />
            <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end">
              <Field id="sh-code" label={t("admin.settings.shipping.code")} required error={fe.code}><Input value={form.code} onChange={(e) => set("code", e.target.value.toLowerCase())} className="font-mono text-xs" /></Field>
              <Field id="sh-name" label={t("admin.settings.shipping.name")} required error={fe.name}><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <label className="flex items-center gap-2 pb-2.5 text-sm"><Switch checked={form.isActive} onCheckedChange={(c) => set("isActive", c)} />{t("admin.settings.shipping.isActive")}</label>
            </div>
            <Field id="sh-desc" label={t("admin.settings.shipping.description")} error={fe.description}><Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={300} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="sh-price" label={t("admin.settings.shipping.price")} required error={fe.price}><Input inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} /></Field>
              <Field id="sh-free" label={t("admin.settings.shipping.freeAbove")} error={fe.freeAbove}><Input inputMode="decimal" value={form.freeAbove} onChange={(e) => set("freeAbove", e.target.value)} placeholder="—" /></Field>
              <Field id="sh-min" label={t("admin.settings.shipping.minDays")} error={fe.minDays}><Input type="number" min={0} value={form.minDays} onChange={(e) => set("minDays", e.target.value)} /></Field>
              <Field id="sh-max" label={t("admin.settings.shipping.maxDays")} error={fe.maxDays}><Input type="number" min={0} value={form.maxDays} onChange={(e) => set("maxDays", e.target.value)} /></Field>
              <Field id="sh-countries" label={t("admin.settings.shipping.countryCodes")} hint={t("admin.settings.shipping.countryCodesHint")} error={fe.countryCodes}><Input value={form.countryCodes} onChange={(e) => set("countryCodes", e.target.value.toUpperCase())} placeholder="FR, BE, CH" className="uppercase" /></Field>
              <Field id="sh-order" label={t("admin.settings.shipping.sortOrder")} error={fe.sortOrder}><Input type="number" min={0} value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></Field>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
            <Button type="submit" loading={pending}>{t("common.actions.save")}</Button>
          </DialogFooter>
        </form>
  );
}

function ShippingDialog({ open, onOpenChange, method }: { open: boolean; onOpenChange: (open: boolean) => void; method?: ShippingMethodRow }) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" closeLabel={t("common.actions.close")}><ShippingForm method={method} onClose={() => onOpenChange(false)} /></DialogContent>
    </Dialog>
  );
}

export function SettingsShipping({ methods }: { methods: ShippingMethodRow[] }) {
  const t = useT();
  const toast = useToast();
  const [editing, setEditing] = React.useState<ShippingMethodRow | null | "new">(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [, start] = React.useTransition();
  const remove = (m: ShippingMethodRow) => { if (!window.confirm(t("admin.settings.shipping.deleteConfirm"))) return; setBusy(m.id); start(async () => { const r = await shippingMethodDeleteAction({ id: m.id }); if (r.ok) toast.success(r.message ?? ""); else toast.error(r.error); setBusy(null); }); };
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button size="sm" onClick={() => setEditing("new")}><Plus />{t("admin.settings.shipping.add")}</Button></div>
      <Table>
        <THead><TR><TH>{t("admin.settings.shipping.code")}</TH><TH>{t("admin.settings.shipping.name")}</TH><TH className="text-end">{t("admin.settings.shipping.price")}</TH><TH className="text-end">{t("admin.settings.shipping.freeAbove")}</TH><TH>{t("admin.settings.shipping.delay")}</TH><TH>{t("admin.settings.shipping.countryCodes")}</TH><TH>{t("admin.settings.shipping.isActive")}</TH><TH /></TR></THead>
        <TBody>
          {methods.map((m) => (
            <TR key={m.id}>
              <TD className="font-mono text-xs">{m.code}</TD>
              <TD><span className="font-medium">{m.name}</span>{m.description && <span className="block text-xs text-muted">{m.description}</span>}</TD>
              <TD className="text-end font-semibold tnum">{formatMoney(m.price)}</TD>
              <TD className="text-end tnum">{m.freeAbove !== null ? formatMoney(m.freeAbove) : "—"}</TD>
              <TD className="whitespace-nowrap text-xs">{t("admin.settings.shipping.days", { min: m.minDays, max: m.maxDays })}</TD>
              <TD className="text-xs">{m.countryCodes.length ? m.countryCodes.join(", ") : t("admin.common.all")}</TD>
              <TD>{m.isActive ? <Badge variant="success">{t("common.labels.yes")}</Badge> : <Badge variant="muted">{t("common.labels.no")}</Badge>}</TD>
              <TD className="text-end"><div className="flex justify-end gap-1"><IconButton label={t("common.actions.edit")} size="icon-sm" onClick={() => setEditing(m)}><Pencil /></IconButton><IconButton label={t("common.actions.delete")} size="icon-sm" className="text-error hover:bg-error-soft" disabled={busy === m.id} onClick={() => remove(m)}><Trash2 /></IconButton></div></TD>
            </TR>
          ))}
          {!methods.length && <TR><TD colSpan={8} className="py-8 text-center text-muted">{t("admin.settings.shipping.none")}</TD></TR>}
        </TBody>
      </Table>
      <ShippingDialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null); }} method={editing && editing !== "new" ? editing : undefined} />
    </div>
  );
}
