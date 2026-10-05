"use client";

import { useT } from "@/i18n/client";
import { slugify } from "@/lib/utils";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/checkbox";
import { PRODUCT_STATUSES, type PanelProps } from "./product-form-types";

/** Onglet Général + SEO du formulaire produit. */
export function ProductGeneralPanel({ form, update, refs, errors }: PanelProps) {
  const t = useT();
  const err = (k: string) => (errors[k] ? t("common.errors.validation") : undefined);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="p-name" label={t("admin.products.form.name")} required error={err("name")}><Input value={form.name} onChange={(e) => update({ name: e.target.value, ...(form.slugTouched ? {} : { slug: slugify(e.target.value) }) })} /></Field>
          <Field id="p-slug" label={t("admin.products.form.slug")} required error={errors.slug ? t("admin.products.form.slugTaken") : undefined}><Input value={form.slug} onChange={(e) => update({ slug: slugify(e.target.value) || e.target.value.toLowerCase(), slugTouched: true })} className="font-mono text-sm" /></Field>
          <Field id="p-sku" label={t("admin.products.form.sku")} required error={errors.sku ? t("admin.products.form.skuTaken") : undefined}><Input value={form.sku} onChange={(e) => update({ sku: e.target.value.toUpperCase() })} className="font-mono text-sm uppercase" /></Field>
          <Field id="p-status" label={t("admin.products.form.status")}><Select value={form.status} onChange={(e) => update({ status: e.target.value as typeof form.status })}>{PRODUCT_STATUSES.map((s) => <option key={s} value={s}>{t.enum("common.status.product", s)}</option>)}</Select></Field>
        </div>
        <Field id="p-short" label={t("admin.products.form.shortDescription")}><Textarea rows={2} value={form.shortDescription} onChange={(e) => update({ shortDescription: e.target.value })} /></Field>
        <Field id="p-desc" label={t("admin.products.form.description")}><Textarea rows={10} value={form.description} onChange={(e) => update({ description: e.target.value })} className="font-mono text-[13px]" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="p-usage" label={t("admin.products.form.usageTips")}><Textarea rows={4} value={form.usageTips} onChange={(e) => update({ usageTips: e.target.value })} /></Field>
          <Field id="p-shipping" label={t("admin.products.form.shippingInfo")}><Textarea rows={4} value={form.shippingInfo} onChange={(e) => update({ shippingInfo: e.target.value })} /></Field>
        </div>
        <Field id="p-keywords" label={t("admin.products.form.keywords")} hint={t("admin.products.form.keywordsHint")}><Input value={form.keywords} onChange={(e) => update({ keywords: e.target.value })} /></Field>
        <Field id="p-video" label={t("admin.products.form.videoUrl")} error={err("videoUrl")}><Input type="url" value={form.videoUrl} onChange={(e) => update({ videoUrl: e.target.value })} placeholder="https://" /></Field>
        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-semibold">{t("admin.products.form.seo")}</legend>
          <div className="space-y-3">
            <Field id="p-seo-title" label={t("admin.products.form.seoTitle")}><Input value={form.seoTitle} maxLength={160} onChange={(e) => update({ seoTitle: e.target.value })} /></Field>
            <Field id="p-seo-desc" label={t("admin.products.form.seoDescription")}><Textarea rows={3} value={form.seoDescription} maxLength={320} onChange={(e) => update({ seoDescription: e.target.value })} /></Field>
          </div>
        </fieldset>
      </div>
      <aside className="space-y-4">
        <Field id="p-category" label={t("admin.products.form.category")} required error={err("categoryId")}>
          <Select value={form.categoryId} onChange={(e) => update({ categoryId: e.target.value })} placeholder="—">
            {refs.categories.map((c) => <option key={c.id} value={c.id}>{`${"  ".repeat(c.level)}${c.level ? "↳ " : ""}${c.name}`}</option>)}
          </Select>
        </Field>
        <Field id="p-brand" label={t("admin.products.form.brand")}><Select value={form.brandId} onChange={(e) => update({ brandId: e.target.value })}><option value="">—</option>{refs.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
        <Field id="p-tax" label={t("admin.products.form.taxClass")}><Select value={form.taxClassId} onChange={(e) => update({ taxClassId: e.target.value })}><option value="">—</option>{refs.taxClasses.map((c) => <option key={c.id} value={c.id}>{`${c.name} (${(c.rateBps / 100).toFixed(1)} %)`}</option>)}</Select></Field>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"><span>{t("admin.products.form.requiresAccount")}</span><Switch checked={form.requiresAccount} onCheckedChange={(c) => update({ requiresAccount: c })} /></label>
      </aside>
    </div>
  );
}
