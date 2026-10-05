"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { formatMoney, parseMoneyInput } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { businessStatusAction, businessUpdateAction, customerPriceAction, deleteCustomerPriceAction, customerGroupAction } from "@/app/actions/admin/sales";

export function BusinessStatusButtons({ businessId, status }: { businessId: string; status: string }) {
  const t = useT();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  const set = (s: "VERIFIED" | "APPROVED" | "REJECTED" | "SUSPENDED") => start(async () => toast.fromResult(await businessStatusAction({ businessId, status: s })));
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "APPROVED" && <Button size="sm" variant="accent" loading={pending} onClick={() => set("APPROVED")}>{t("admin.customers.detail.approve")}</Button>}
      {status === "PENDING" && <Button size="sm" variant="outline" disabled={pending} onClick={() => set("VERIFIED")}>{t("admin.customers.detail.verify")}</Button>}
      {status === "PENDING" && <Button size="sm" variant="danger-outline" disabled={pending} onClick={() => set("REJECTED")}>{t("admin.customers.detail.reject")}</Button>}
      {status !== "SUSPENDED" && status !== "PENDING" && <Button size="sm" variant="danger-outline" disabled={pending} onClick={() => set("SUSPENDED")}>{t("admin.customers.detail.suspend")}</Button>}
      {status === "SUSPENDED" && <Button size="sm" variant="outline" disabled={pending} onClick={() => set("APPROVED")}>{t("admin.customers.detail.reactivate")}</Button>}
    </div>
  );
}

export function BusinessPricingForm({ businessId, groups, customerGroupId, allowInvoicePay, invoiceTermDays, creditLimit, internalNotes }: { businessId: string; groups: { id: string; name: string }[]; customerGroupId: string | null; allowInvoicePay: boolean; invoiceTermDays: number; creditLimit: number | null; internalNotes: string | null }) {
  const t = useT();
  const toast = useToast();
  const [form, setForm] = React.useState({ customerGroupId: customerGroupId ?? "", allowInvoicePay, invoiceTermDays: String(invoiceTermDays), creditLimit: creditLimit !== null ? (creditLimit / 100).toFixed(2) : "", internalNotes: internalNotes ?? "" });
  const [pending, start] = React.useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => toast.fromResult(await businessUpdateAction({ businessId, customerGroupId: form.customerGroupId || null, allowInvoicePay: form.allowInvoicePay, invoiceTermDays: Number(form.invoiceTermDays), creditLimit: form.creditLimit ? parseMoneyInput(form.creditLimit) : null, internalNotes: form.internalNotes }))); }} className="space-y-3">
      <Field id="group" label={t("admin.customers.detail.group")}><Select value={form.customerGroupId} onChange={(e) => setForm({ ...form, customerGroupId: e.target.value })}><option value="">—</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Field>
      <label className="flex items-center justify-between gap-3 text-sm"><span>{t("admin.customers.detail.invoicePayment")}</span><Switch checked={form.allowInvoicePay} onCheckedChange={(c) => setForm({ ...form, allowInvoicePay: c })} /></label>
      <div className="grid grid-cols-2 gap-3">
        <Field id="termDays" label={t("admin.customers.detail.invoiceTermDays")}><Input type="number" min={0} value={form.invoiceTermDays} onChange={(e) => setForm({ ...form, invoiceTermDays: e.target.value })} /></Field>
        <Field id="credit" label={t("admin.customers.detail.creditLimit")}><Input inputMode="decimal" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} placeholder="—" /></Field>
      </div>
      <Field id="notes" label={t("admin.customers.detail.internalNotes")}><Textarea rows={3} value={form.internalNotes} onChange={(e) => setForm({ ...form, internalNotes: e.target.value })} /></Field>
      <Button type="submit" size="sm" loading={pending}>{t("common.actions.save")}</Button>
    </form>
  );
}

export function CustomerPrices({ businessId, prices }: { businessId: string; prices: { id: string; sku: string; name: string; minQuantity: number; unitPrice: number; basePrice: number }[] }) {
  const t = useT();
  const toast = useToast();
  const [form, setForm] = React.useState({ sku: "", minQuantity: "1", unitPrice: "" });
  const [pending, start] = React.useTransition();
  return (
    <div className="space-y-3">
      {prices.length > 0 && (
        <table className="w-full text-sm">
          <thead className="text-xs text-muted"><tr><th className="py-1 text-start font-semibold">SKU</th><th className="py-1 text-end font-semibold">{t("admin.customers.detail.minQuantity")}</th><th className="py-1 text-end font-semibold">{t("admin.customers.detail.unitPrice")}</th><th className="py-1 text-end font-semibold">{t("admin.products.form.basePrice")}</th><th /></tr></thead>
          <tbody>{prices.map((p) => <tr key={p.id} className="border-t border-border"><td className="py-1.5"><span className="font-mono text-xs">{p.sku}</span><span className="block text-xs text-muted">{p.name}</span></td><td className="py-1.5 text-end tnum">{p.minQuantity}</td><td className="py-1.5 text-end font-semibold tnum">{formatMoney(p.unitPrice)}</td><td className="py-1.5 text-end text-muted tnum">{formatMoney(p.basePrice)}</td><td className="py-1.5 text-end"><Button size="icon-sm" variant="ghost" aria-label={t("common.actions.delete")} onClick={() => start(async () => { await deleteCustomerPriceAction({ id: p.id }); })}><Trash2 /></Button></td></tr>)}</tbody>
        </table>
      )}
      <form onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await customerPriceAction({ businessId, sku: form.sku, minQuantity: Number(form.minQuantity), unitPrice: parseMoneyInput(form.unitPrice) ?? 0 }); if (r.ok) { toast.success(r.message ?? ""); setForm({ sku: "", minQuantity: "1", unitPrice: "" }); } else toast.error(r.error); }); }} className="grid grid-cols-[1fr_80px_110px_auto] items-end gap-2">
        <Field id="cp-sku" label={t("admin.customers.detail.variant")}><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} className="h-9 text-sm uppercase" /></Field>
        <Field id="cp-min" label={t("admin.customers.detail.minQuantity")}><Input type="number" min={1} value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} className="h-9 text-sm" /></Field>
        <Field id="cp-price" label={t("admin.customers.detail.unitPrice")}><Input inputMode="decimal" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className="h-9 text-sm" /></Field>
        <Button type="submit" size="sm" loading={pending} disabled={!form.sku || !form.unitPrice}>{t("common.actions.add")}</Button>
      </form>
    </div>
  );
}

export function CustomerGroupForm({ group }: { group?: { id: string; code: string; name: string; discountBps: number; isDefault: boolean; description: string | null } }) {
  const t = useT();
  const toast = useToast();
  const [form, setForm] = React.useState({ code: group?.code ?? "", name: group?.name ?? "", discount: group ? (group.discountBps / 100).toString() : "0", isDefault: group?.isDefault ?? false, description: group?.description ?? "" });
  const [pending, start] = React.useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => toast.fromResult(await customerGroupAction({ id: group?.id, code: form.code, name: form.name, discountBps: Math.round(Number(form.discount.replace(",", ".")) * 100), isDefault: form.isDefault, description: form.description }))); }} className="grid gap-3 sm:grid-cols-[120px_1fr_100px_auto_auto] sm:items-end">
      <Field id={`g-code-${group?.id ?? "new"}`} label={t("admin.customers.groups.code")}><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="h-9 text-sm" disabled={!!group} /></Field>
      <Field id={`g-name-${group?.id ?? "new"}`} label={t("admin.customers.groups.name")}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-sm" /></Field>
      <Field id={`g-disc-${group?.id ?? "new"}`} label={t("admin.customers.groups.discount")}><Input inputMode="decimal" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="h-9 text-sm" /></Field>
      <label className="flex items-center gap-2 pb-2 text-sm"><Switch checked={form.isDefault} onCheckedChange={(c) => setForm({ ...form, isDefault: c })} />{t("admin.customers.groups.isDefault")}</label>
      <Button type="submit" size="sm" loading={pending} className="mb-0.5">{t("common.actions.save")}</Button>
    </form>
  );
}
