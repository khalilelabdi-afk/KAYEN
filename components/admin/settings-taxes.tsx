"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { Switch } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogHeading } from "@/components/ui/dialog";
import { taxClassSaveAction, taxClassDeleteAction } from "@/app/actions/admin/settings";

export interface TaxClassRow { id: string; code: string; name: string; rateBps: number; isDefault: boolean; productCount: number }

const toForm = (x?: TaxClassRow) => ({ code: x?.code ?? "", name: x?.name ?? "", rate: x ? (x.rateBps / 100).toString() : "20", isDefault: x?.isDefault ?? false });

/** Le contenu est démonté à la fermeture : l'état repart des props à chaque ouverture. */
function TaxForm({ tax, onClose }: { tax?: TaxClassRow; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const [form, setForm] = React.useState(() => toForm(tax));
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string[]>>({});
  const [pending, start] = React.useTransition();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const rate = Number.parseFloat(form.rate.replace(",", "."));
      const r = await taxClassSaveAction({ id: tax?.id, code: form.code, name: form.name, rateBps: Number.isFinite(rate) ? Math.round(rate * 100) : Number.NaN, isDefault: form.isDefault });
      if (r.ok) { toast.success(r.message ?? ""); onClose(); } else { setError(r.error); setFe(r.fieldErrors ?? {}); }
    });
  };
  return (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader><DialogHeading>{tax ? t("admin.settings.taxes.edit") : t("admin.settings.taxes.add")}</DialogHeading></DialogHeader>
          <DialogBody className="space-y-3">
            <FormError message={error} />
            <Field id="tx-code" label={t("admin.settings.taxes.code")} required error={fe.code}><Input value={form.code} onChange={(e) => set("code", e.target.value.toLowerCase())} className="font-mono text-xs" /></Field>
            <Field id="tx-name" label={t("admin.settings.taxes.name")} required error={fe.name}><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field id="tx-rate" label={t("admin.settings.taxes.rate")} required error={fe.rateBps}><Input inputMode="decimal" value={form.rate} onChange={(e) => set("rate", e.target.value)} /></Field>
            <label className="flex items-center justify-between gap-3 text-sm"><span>{t("admin.settings.taxes.isDefault")}</span><Switch checked={form.isDefault} onCheckedChange={(c) => set("isDefault", c)} /></label>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
            <Button type="submit" loading={pending}>{t("common.actions.save")}</Button>
          </DialogFooter>
        </form>
  );
}

function TaxDialog({ open, onOpenChange, tax }: { open: boolean; onOpenChange: (open: boolean) => void; tax?: TaxClassRow }) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" closeLabel={t("common.actions.close")}><TaxForm tax={tax} onClose={() => onOpenChange(false)} /></DialogContent>
    </Dialog>
  );
}

export function SettingsTaxes({ taxes }: { taxes: TaxClassRow[] }) {
  const t = useT();
  const toast = useToast();
  const [editing, setEditing] = React.useState<TaxClassRow | null | "new">(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [, start] = React.useTransition();
  const remove = (x: TaxClassRow) => { if (!window.confirm(t("admin.settings.taxes.deleteConfirm"))) return; setBusy(x.id); start(async () => { const r = await taxClassDeleteAction({ id: x.id }); if (r.ok) toast.success(r.message ?? ""); else toast.error(r.error); setBusy(null); }); };
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button size="sm" onClick={() => setEditing("new")}><Plus />{t("admin.settings.taxes.add")}</Button></div>
      <Table>
        <THead><TR><TH>{t("admin.settings.taxes.code")}</TH><TH>{t("admin.settings.taxes.name")}</TH><TH className="text-end">{t("admin.settings.taxes.rate")}</TH><TH className="text-end">{t("common.labels.products")}</TH><TH>{t("admin.settings.taxes.isDefault")}</TH><TH /></TR></THead>
        <TBody>
          {taxes.map((x) => (
            <TR key={x.id}>
              <TD className="font-mono text-xs">{x.code}</TD>
              <TD className="font-medium">{x.name}</TD>
              <TD className="text-end font-semibold tnum">{(x.rateBps / 100).toLocaleString("fr-FR")} %</TD>
              <TD className="text-end text-muted tnum">{x.productCount}</TD>
              <TD>{x.isDefault && <Badge variant="accent">{t("admin.settings.taxes.isDefault")}</Badge>}</TD>
              <TD className="text-end"><div className="flex justify-end gap-1"><IconButton label={t("common.actions.edit")} size="icon-sm" onClick={() => setEditing(x)}><Pencil /></IconButton><IconButton label={t("common.actions.delete")} size="icon-sm" className="text-error hover:bg-error-soft" disabled={busy === x.id || x.isDefault} onClick={() => remove(x)}><Trash2 /></IconButton></div></TD>
            </TR>
          ))}
          {!taxes.length && <TR><TD colSpan={6} className="py-8 text-center text-muted">{t("admin.settings.taxes.none")}</TD></TR>}
        </TBody>
      </Table>
      <TaxDialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null); }} tax={editing && editing !== "new" ? editing : undefined} />
    </div>
  );
}
