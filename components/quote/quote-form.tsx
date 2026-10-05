"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { CheckboxField } from "@/components/ui/checkbox";
import { submitQuoteAction, type QuoteFormState } from "@/app/actions/quote";
import { track } from "@/lib/analytics";

export interface QuoteFormItem { variantId?: string; sku: string; name: string; quantity: number }

export function QuoteForm({ source, initialItems, cartCount, defaults }: { source: "PRODUCT" | "CART" | "CONTACT"; initialItems: QuoteFormItem[]; cartCount: number; defaults: { companyName?: string; contactName?: string; email?: string; phone?: string } }) {
  const t = useT();
  const [state, action, pending] = useActionState<QuoteFormState, FormData>(submitQuoteAction, undefined);
  const [items, setItems] = React.useState<QuoteFormItem[]>(initialItems.length ? initialItems : source === "CART" ? [] : [{ sku: "", name: "", quantity: 1 }]);
  const v: Record<string, string | undefined> = { ...defaults, ...(state?.values ?? {}) };
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} onSubmit={() => track({ name: "request_quote", params: { source, items: items.length || cartCount } })} className="space-y-8" noValidate encType="multipart/form-data">
      <input type="hidden" name="source" value={source} />
      <FormError message={state?.error} />

      <fieldset>
        <legend className="t-h4 mb-3">{t("quote.form.products")}</legend>
        {source === "CART" && cartCount > 0 && <p className="mb-3 rounded-md bg-accent-softer px-3 py-2 text-sm text-accent">{t("quote.form.fromCart", { count: cartCount })}</p>}
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 sm:grid-cols-[1fr_1fr_120px_auto]">
              {item.variantId && <input type="hidden" name={`items[${i}].variantId`} value={item.variantId} />}
              <Input name={`items[${i}].sku`} value={item.sku} onChange={(e) => setItems((s) => s.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))} placeholder={t("common.labels.sku")} aria-label={t("common.labels.sku")} readOnly={!!item.variantId} className="sm:col-span-1" />
              <Input name={`items[${i}].name`} value={item.name} onChange={(e) => setItems((s) => s.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder={t("quote.form.product")} aria-label={t("quote.form.product")} readOnly={!!item.variantId} className="col-span-3 sm:col-span-1" />
              <Input name={`items[${i}].quantity`} type="number" min={1} value={item.quantity} onChange={(e) => setItems((s) => s.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) || 1 } : x)))} aria-label={t("quote.form.quantity")} className="w-28" />
              <Button type="button" variant="ghost" size="icon" aria-label={t("quote.form.removeProduct")} onClick={() => setItems((s) => s.filter((_, j) => j !== i))}><Trash2 /></Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setItems((s) => [...s, { sku: "", name: "", quantity: 1 }])}><Plus />{t("quote.form.addProduct")}</Button>
        {items.length === 0 && source !== "CART" && <p className="mt-2 text-xs text-muted">{t("quote.form.noProduct")}</p>}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="t-h4 mb-1">{t("quote.form.contact")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="companyName" label={t("quote.form.company")} required error={fe.companyName}><Input name="companyName" required defaultValue={v.companyName} autoComplete="organization" /></Field>
          <Field id="contactName" label={t("quote.form.contact")} required error={fe.contactName}><Input name="contactName" required defaultValue={v.contactName} autoComplete="name" /></Field>
          <Field id="email" label={t("quote.form.email")} required error={fe.email}><Input name="email" type="email" required defaultValue={v.email} autoComplete="email" /></Field>
          <Field id="phone" label={t("quote.form.phone")} optionalLabel={t("common.labels.optional")} error={fe.phone}><Input name="phone" type="tel" defaultValue={v.phone} autoComplete="tel" /></Field>
          <Field id="desiredDate" label={t("quote.form.desiredDate")} optionalLabel={t("common.labels.optional")} error={fe.desiredDate}><Input name="desiredDate" type="date" defaultValue={v.desiredDate} /></Field>
          <Field id="attachment" label={t("quote.form.attachment")} hint={t("quote.form.attachmentHint")}><Input name="attachment" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.doc,.docx" className="pt-1.5 file:me-3 file:rounded file:border-0 file:bg-paper-2 file:px-2 file:py-1 file:text-xs" /></Field>
        </div>
        <Field id="message" label={t("quote.form.message")} error={fe.message}><Textarea name="message" rows={5} placeholder={t("quote.form.messagePlaceholder")} defaultValue={v.message} /></Field>
        <div>
          <CheckboxField id="consent" name="consent" label={t("quote.form.consent")} />
          {fe.consent && <p className="mt-1 text-xs font-medium text-error" role="alert">{fe.consent[0]}</p>}
        </div>
      </fieldset>
      <Button type="submit" size="lg" loading={pending}>{pending ? t("quote.form.submitting") : t("quote.form.submit")}</Button>
    </form>
  );
}
