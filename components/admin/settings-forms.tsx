"use client";

import * as React from "react";
import { useT } from "@/i18n/client";
import { parseMoneyInput, toMoneyInput } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { AdminCard } from "@/components/admin/ui";
import { settingsContactAction, settingsCommerceAction, type ContactSettingsInput, type CommerceSettingsInput } from "@/app/actions/admin/settings";

export function SettingsContactForm({ settings }: { settings: ContactSettingsInput }) {
  const t = useT();
  const toast = useToast();
  const [form, setForm] = React.useState({ ...settings, companyAddress: { ...settings.companyAddress } });
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string[]>>({});
  const [pending, start] = React.useTransition();
  const set = (key: keyof Omit<ContactSettingsInput, "companyAddress">, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const setAddr = (key: keyof ContactSettingsInput["companyAddress"], value: string) => setForm((f) => ({ ...f, companyAddress: { ...f.companyAddress, [key]: value } }));
  const submit = (e: React.FormEvent) => { e.preventDefault(); start(async () => { const r = await settingsContactAction(form); if (r.ok) { toast.success(r.message ?? ""); setError(null); setFe({}); } else { setError(r.error); setFe(r.fieldErrors ?? {}); } }); };
  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <FormError message={error} />
      <AdminCard title={t("admin.settings.sections.contact")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="st-supportEmail" label={t("admin.settings.fields.supportEmail")} required error={fe.supportEmail}><Input type="email" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} /></Field>
          <Field id="st-salesEmail" label={t("admin.settings.fields.salesEmail")} required error={fe.salesEmail}><Input type="email" value={form.salesEmail} onChange={(e) => set("salesEmail", e.target.value)} /></Field>
          <Field id="st-supportPhone" label={t("admin.settings.fields.supportPhone")} required error={fe.supportPhone}><Input type="tel" value={form.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} /></Field>
          <Field id="st-supportHours" label={t("admin.settings.fields.supportHours")} error={fe.supportHours}><Input value={form.supportHours} onChange={(e) => set("supportHours", e.target.value)} /></Field>
        </div>
      </AdminCard>
      <AdminCard title={t("admin.settings.fields.companyAddress")}>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <Field id="st-line1" label={t("admin.settings.fields.addressLine1")} required error={fe["companyAddress.line1"]} className="sm:col-span-2"><Input value={form.companyAddress.line1} onChange={(e) => setAddr("line1", e.target.value)} /></Field>
          <Field id="st-city" label={t("admin.settings.fields.city")} required error={fe["companyAddress.city"]}><Input value={form.companyAddress.city} onChange={(e) => setAddr("city", e.target.value)} /></Field>
          <Field id="st-postal" label={t("admin.settings.fields.postalCode")} required error={fe["companyAddress.postalCode"]}><Input value={form.companyAddress.postalCode} onChange={(e) => setAddr("postalCode", e.target.value)} /></Field>
          <Field id="st-country" label={t("admin.settings.fields.countryCode")} required error={fe["companyAddress.countryCode"]}><Input value={form.companyAddress.countryCode} maxLength={2} onChange={(e) => setAddr("countryCode", e.target.value.toUpperCase())} className="w-24 uppercase" /></Field>
        </div>
      </AdminCard>
      <Button type="submit" loading={pending}>{t("common.actions.save")}</Button>
    </form>
  );
}

export function SettingsCommerceForm({ settings }: { settings: CommerceSettingsInput }) {
  const t = useT();
  const toast = useToast();
  const [form, setForm] = React.useState({
    freeShippingThreshold: settings.freeShippingThreshold === null ? "" : toMoneyInput(settings.freeShippingThreshold), minimumOrderAmount: toMoneyInput(settings.minimumOrderAmount), quoteValidityDays: String(settings.quoteValidityDays),
    minDays: String(settings.defaultLeadTime.minDays), maxDays: String(settings.defaultLeadTime.maxDays), taxIdLabel: settings.taxIdLabel, taxIdPlaceholder: settings.taxIdPlaceholder, taxDisplay: settings.taxDisplay,
    bankDetails: settings.bankDetails, returnPolicy: settings.returnPolicy, announcement: settings.announcement, newProductDays: String(settings.newProductDays),
  });
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string[]>>({});
  const [pending, start] = React.useTransition();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await settingsCommerceAction({
        freeShippingThreshold: form.freeShippingThreshold.trim() ? (parseMoneyInput(form.freeShippingThreshold) ?? Number.NaN) : null, minimumOrderAmount: parseMoneyInput(form.minimumOrderAmount || "0") ?? Number.NaN, quoteValidityDays: Number(form.quoteValidityDays),
        defaultLeadTime: { minDays: Number(form.minDays), maxDays: Number(form.maxDays) }, taxIdLabel: form.taxIdLabel, taxIdPlaceholder: form.taxIdPlaceholder, taxDisplay: form.taxDisplay,
        bankDetails: form.bankDetails, returnPolicy: form.returnPolicy, announcement: form.announcement, newProductDays: Number(form.newProductDays),
      });
      if (r.ok) { toast.success(r.message ?? ""); setError(null); setFe({}); } else { setError(r.error); setFe(r.fieldErrors ?? {}); }
    });
  };
  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <FormError message={error} />
      <AdminCard title={t("admin.settings.sections.commerce")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="st-free" label={t("admin.settings.fields.freeShippingThreshold")} hint={t("admin.settings.fields.freeShippingHint")} error={fe.freeShippingThreshold}><Input inputMode="decimal" value={form.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", e.target.value)} /></Field>
          <Field id="st-min" label={t("admin.settings.fields.minimumOrderAmount")} hint={t("admin.settings.fields.minimumOrderHint")} error={fe.minimumOrderAmount}><Input inputMode="decimal" value={form.minimumOrderAmount} onChange={(e) => set("minimumOrderAmount", e.target.value)} /></Field>
          <Field id="st-quote" label={t("admin.settings.fields.quoteValidityDays")} error={fe.quoteValidityDays}><Input type="number" min={1} max={365} value={form.quoteValidityDays} onChange={(e) => set("quoteValidityDays", e.target.value)} /></Field>
          <Field id="st-new" label={t("admin.settings.fields.newProductDays")} error={fe.newProductDays}><Input type="number" min={0} max={365} value={form.newProductDays} onChange={(e) => set("newProductDays", e.target.value)} /></Field>
          <Field id="st-leadmin" label={t("admin.settings.fields.defaultLeadTimeMin")} error={fe["defaultLeadTime.minDays"]}><Input type="number" min={0} value={form.minDays} onChange={(e) => set("minDays", e.target.value)} /></Field>
          <Field id="st-leadmax" label={t("admin.settings.fields.defaultLeadTimeMax")} error={fe["defaultLeadTime.maxDays"]}><Input type="number" min={0} value={form.maxDays} onChange={(e) => set("maxDays", e.target.value)} /></Field>
          <Field id="st-taxlabel" label={t("admin.settings.fields.taxIdLabel")} required error={fe.taxIdLabel}><Input value={form.taxIdLabel} onChange={(e) => set("taxIdLabel", e.target.value)} /></Field>
          <Field id="st-taxph" label={t("admin.settings.fields.taxIdPlaceholder")} error={fe.taxIdPlaceholder}><Input value={form.taxIdPlaceholder} onChange={(e) => set("taxIdPlaceholder", e.target.value)} /></Field>
          <Field id="st-taxdisplay" label={t("admin.settings.fields.taxDisplay")} error={fe.taxDisplay}><Select value={form.taxDisplay} onChange={(e) => set("taxDisplay", e.target.value as "HT" | "TTC")}><option value="HT">{t("common.labels.taxExcluded")}</option><option value="TTC">{t("common.labels.taxIncluded")}</option></Select></Field>
        </div>
      </AdminCard>
      <AdminCard title={t("admin.settings.sections.legal")}>
        <div className="space-y-3">
          <Field id="st-announcement" label={t("admin.settings.fields.announcement")} error={fe.announcement}><Input value={form.announcement} onChange={(e) => set("announcement", e.target.value)} maxLength={200} /></Field>
          <Field id="st-bank" label={t("admin.settings.fields.bankDetails")} error={fe.bankDetails}><Textarea rows={4} value={form.bankDetails} onChange={(e) => set("bankDetails", e.target.value)} maxLength={2000} /></Field>
          <Field id="st-return" label={t("admin.settings.fields.returnPolicy")} error={fe.returnPolicy}><Textarea rows={3} value={form.returnPolicy} onChange={(e) => set("returnPolicy", e.target.value)} maxLength={2000} /></Field>
        </div>
      </AdminCard>
      <Button type="submit" loading={pending}>{t("common.actions.save")}</Button>
    </form>
  );
}
