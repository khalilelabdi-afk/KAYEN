"use client";

import { Plus, Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button, IconButton } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/checkbox";
import { emptyVariant, newKey, type PanelProps, type VariantState } from "./product-form-types";

/** Onglet Variantes & prix : options, variantes (upsert par SKU côté serveur) et paliers. */
export function ProductVariantsPanel({ form, update, errors }: PanelProps) {
  const t = useT();
  const variants = form.variants;
  const setVariant = (i: number, patch: Partial<VariantState>) => update({ variants: variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) });
  const addVariant = () => update({ variants: [...variants, emptyVariant(form.hasVariants ? "" : form.sku, { isDefault: variants.length === 0, unitLabel: variants[0]?.unitLabel ?? "unité", moq: variants[0]?.moq ?? "1" })] });
  const removeVariant = (i: number) => { const next = variants.filter((_, j) => j !== i); if (next.length && !next.some((v) => v.isDefault)) next[0] = { ...next[0], isDefault: true }; update({ variants: next }); };
  const setDefault = (i: number) => update({ variants: variants.map((v, j) => ({ ...v, isDefault: j === i })) });
  const options = form.options;
  const setOption = (i: number, patch: Partial<(typeof options)[number]>) => update({ options: options.map((o, j) => (j === i ? { ...o, ...patch } : o)) });
  const optionValues = (name: string) => options.find((o) => o.name === name)?.values.split(",").map((v) => v.trim()).filter(Boolean) ?? [];
  const variantErrors = errors.variants ?? [];

  return (
    <div className="space-y-6">
      <label className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 text-sm">
        <span><span className="font-medium">{t("admin.products.form.hasVariants")}</span><span className="block text-xs text-muted">{t("admin.products.form.hasVariantsHint")}</span></span>
        <Switch checked={form.hasVariants} onCheckedChange={(c) => update({ hasVariants: c })} />
      </label>

      {form.hasVariants && (
        <section className="space-y-3 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold">{t("admin.products.form.options")}</h3>
          {options.map((o, i) => (
            <div key={o.key} className="grid gap-2 sm:grid-cols-[200px_1fr_auto] sm:items-end">
              <Field id={`opt-name-${o.key}`} label={t("admin.products.form.optionName")}><Input value={o.name} onChange={(e) => setOption(i, { name: e.target.value })} className="h-9 text-sm" /></Field>
              <Field id={`opt-values-${o.key}`} label={t("admin.products.form.optionValue")} hint={t("admin.products.form.optionValuesHint")}><Input value={o.values} onChange={(e) => setOption(i, { values: e.target.value })} className="h-9 text-sm" /></Field>
              <IconButton size="icon-sm" label={t("common.actions.delete")} className="mb-5" onClick={() => update({ options: options.filter((_, j) => j !== i) })}><Trash2 /></IconButton>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" disabled={options.length >= 5} onClick={() => update({ options: [...options, { key: newKey(), name: "", values: "" }] })}><Plus />{t("admin.products.form.addOption")}</Button>
        </section>
      )}

      {variants.length === 0 && <p className="rounded-lg border border-dashed border-border-strong p-6 text-center text-sm text-muted">{t("admin.products.form.noVariants")}</p>}
      {variants.map((v, i) => (
        <VariantCard key={v.key} index={i} variant={v} optionNames={form.hasVariants ? options.map((o) => o.name).filter(Boolean) : []} optionValues={optionValues} hasError={variantErrors.includes(v.sku) || Object.keys(errors).some((k) => k.startsWith(`variants.${i}.`))} onChange={(patch) => setVariant(i, patch)} onDefault={() => setDefault(i)} onRemove={() => removeVariant(i)} canRemove={variants.length > 1} />
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={addVariant}><Plus />{t("admin.products.form.addVariant")}</Button>
      <p className="text-xs text-muted">{t("admin.products.form.removeVariantHint")}</p>
    </div>
  );
}

function VariantCard({ index, variant: v, optionNames, optionValues, hasError, onChange, onDefault, onRemove, canRemove }: { index: number; variant: VariantState; optionNames: string[]; optionValues: (name: string) => string[]; hasError: boolean; onChange: (patch: Partial<VariantState>) => void; onDefault: () => void; onRemove: () => void; canRemove: boolean }) {
  const t = useT();
  const id = (f: string) => `v-${v.key}-${f}`;
  const num = (field: keyof VariantState, label: string, extra?: { min?: number; placeholder?: string }) => (
    <Field id={id(field)} label={label}><Input type="number" min={extra?.min ?? 0} value={String(v[field])} placeholder={extra?.placeholder} onChange={(e) => onChange({ [field]: e.target.value } as Partial<VariantState>)} className="h-9 text-sm" /></Field>
  );
  const money = (field: "basePrice" | "compareAtPrice" | "costPrice", label: string, required?: boolean) => (
    <Field id={id(field)} label={label} required={required}><Input inputMode="decimal" value={v[field]} placeholder="0,00" onChange={(e) => onChange({ [field]: e.target.value })} className="h-9 text-sm tnum" /></Field>
  );
  const tiers = v.tiers;
  const setTier = (i: number, patch: Partial<(typeof tiers)[number]>) => onChange({ tiers: tiers.map((tr, j) => (j === i ? { ...tr, ...patch } : tr)) });
  return (
    <section className={`space-y-4 rounded-lg border p-4 ${hasError ? "border-error" : "border-border"}`} aria-label={`${t("admin.products.form.variant")} ${index + 1}`}>
      <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto_auto_auto] sm:items-end">
        <Field id={id("sku")} label={t("admin.products.form.variantSku")} required><Input value={v.sku} onChange={(e) => onChange({ sku: e.target.value.toUpperCase() })} className="h-9 font-mono text-sm uppercase" /></Field>
        <Field id={id("name")} label={t("admin.products.form.variantName")}><Input value={v.name} onChange={(e) => onChange({ name: e.target.value })} className="h-9 text-sm" /></Field>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="radio" name="variant-default" checked={v.isDefault} onChange={onDefault} className="size-4 accent-ink" />{t("admin.products.form.isDefault")}</label>
        <label className="flex items-center gap-2 pb-2 text-sm"><Switch checked={v.isActive} onCheckedChange={(c) => onChange({ isActive: c })} />{t("admin.products.form.isActive")}</label>
        <IconButton size="icon-sm" label={t("admin.products.form.removeVariant")} className="mb-1" disabled={!canRemove} onClick={onRemove}><Trash2 /></IconButton>
      </div>
      {optionNames.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {optionNames.map((name) => {
            const values = optionValues(name);
            return (
              <Field key={name} id={id(`opt-${name}`)} label={name}>
                {values.length ? (
                  <Select value={v.options[name] ?? ""} onChange={(e) => onChange({ options: { ...v.options, [name]: e.target.value } })} className="h-9 text-sm"><option value="">—</option>{values.map((val) => <option key={val} value={val}>{val}</option>)}</Select>
                ) : (
                  <Input value={v.options[name] ?? ""} onChange={(e) => onChange({ options: { ...v.options, [name]: e.target.value } })} className="h-9 text-sm" />
                )}
              </Field>
            );
          })}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {money("basePrice", t("admin.products.form.basePrice"), true)}
        {money("compareAtPrice", t("admin.products.form.compareAtPrice"))}
        {money("costPrice", t("admin.products.form.costPrice"))}
        {num("moq", t("admin.products.form.moq"), { min: 1 })}
        {num("orderMultiple", t("admin.products.form.orderMultiple"), { min: 1 })}
        {num("quoteOnlyAbove", t("admin.products.form.quoteOnlyAbove"), { min: 1 })}
        <Field id={id("unitLabel")} label={t("admin.products.form.unitLabel")} required><Input value={v.unitLabel} onChange={(e) => onChange({ unitLabel: e.target.value })} className="h-9 text-sm" /></Field>
        <Field id={id("packagingLabel")} label={t("admin.products.form.packagingLabel")}><Input value={v.packagingLabel} onChange={(e) => onChange({ packagingLabel: e.target.value })} className="h-9 text-sm" /></Field>
        {num("unitsPerPack", t("admin.products.form.unitsPerPack"), { min: 1 })}
        {num("leadTimeDays", t("admin.products.form.leadTimeDays"))}
        {num("weightGrams", t("admin.products.form.weight"))}
        <Field id={id("ean")} label={t("admin.products.form.ean")}><Input value={v.ean} onChange={(e) => onChange({ ean: e.target.value })} className="h-9 font-mono text-sm" /></Field>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">{t("admin.products.form.dimensions")}</legend>
        <div className="grid max-w-md grid-cols-3 gap-2">
          <Input type="number" min={0} aria-label={t("admin.products.form.length")} placeholder={t("admin.products.form.length")} value={v.lengthMm} onChange={(e) => onChange({ lengthMm: e.target.value })} className="h-9 text-sm" />
          <Input type="number" min={0} aria-label={t("admin.products.form.width")} placeholder={t("admin.products.form.width")} value={v.widthMm} onChange={(e) => onChange({ widthMm: e.target.value })} className="h-9 text-sm" />
          <Input type="number" min={0} aria-label={t("admin.products.form.height")} placeholder={t("admin.products.form.height")} value={v.heightMm} onChange={(e) => onChange({ heightMm: e.target.value })} className="h-9 text-sm" />
        </div>
      </fieldset>
      <div className="rounded-md bg-paper p-3">
        <div className="mb-2 flex items-center justify-between"><h4 className="text-sm font-semibold">{t("admin.products.form.tiers")}</h4><Button type="button" size="sm" variant="ghost" disabled={tiers.length >= 20} onClick={() => onChange({ tiers: [...tiers, { key: newKey(), minQuantity: "", unitPrice: "" }] })}><Plus />{t("admin.products.form.addTier")}</Button></div>
        {tiers.length > 0 && (
          <ul className="space-y-2">
            {tiers.map((tr, i) => (
              <li key={tr.key} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 sm:max-w-md">
                <Field id={id(`tier-min-${tr.key}`)} label={t("admin.products.form.tierMin")}><Input type="number" min={1} value={tr.minQuantity} onChange={(e) => setTier(i, { minQuantity: e.target.value })} className="h-9 text-sm" /></Field>
                <Field id={id(`tier-price-${tr.key}`)} label={t("admin.products.form.tierPrice")}><Input inputMode="decimal" value={tr.unitPrice} onChange={(e) => setTier(i, { unitPrice: e.target.value })} className="h-9 text-sm tnum" /></Field>
                <IconButton size="icon-sm" label={t("common.actions.delete")} className="mb-0.5" onClick={() => onChange({ tiers: tiers.filter((_, j) => j !== i) })}><Trash2 /></IconButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
