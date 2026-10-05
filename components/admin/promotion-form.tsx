"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { parseMoneyInput } from "@/lib/money";
import { Button, IconButton } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { CheckboxField, Switch } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { promotionSaveAction, type PromotionPayload } from "@/app/actions/admin/promotions";

const TYPES = ["PERCENTAGE", "FIXED_AMOUNT", "SPECIAL_PRICE", "BUNDLE", "CLEARANCE", "QUANTITY"] as const;
const SCOPES = ["ORDER", "PRODUCT", "CATEGORY", "BRAND"] as const;
type PromoType = (typeof TYPES)[number];
type PromoScope = (typeof SCOPES)[number];

export interface PromotionRefs { categories: { id: string; name: string; level: number }[]; brands: { id: string; name: string }[]; groups: { id: string; name: string }[] }
export interface CouponState { key: string; code: string; maxUses: string; isActive: boolean; startsAt: string; endsAt: string; usesCount?: number }
export interface PromotionFormInitial {
  id?: string; name: string; description: string; type: PromoType; scope: PromoScope;
  valueBps: string; valueAmount: string; specialPrice: string; minQuantity: string; minOrderAmount: string;
  isAutomatic: boolean; isActive: boolean; startsAt: string; endsAt: string; maxUses: string; maxUsesPerCustomer: string; customerGroupId: string; priority: string; showBadge: boolean; badgeLabel: string;
  productSkus: string; categoryIds: string[]; brandIds: string[]; coupons: CouponState[];
}

let seq = 0;
const newKey = () => `c${Date.now().toString(36)}${(seq++).toString(36)}`;
const empty = (): PromotionFormInitial => ({ name: "", description: "", type: "PERCENTAGE", scope: "PRODUCT", valueBps: "", valueAmount: "", specialPrice: "", minQuantity: "", minOrderAmount: "", isAutomatic: true, isActive: true, startsAt: "", endsAt: "", maxUses: "", maxUsesPerCustomer: "", customerGroupId: "", priority: "0", showBadge: true, badgeLabel: "", productSkus: "", categoryIds: [], brandIds: [], coupons: [] });
const intOrNull = (v: string) => { const n = Number.parseInt(v.trim(), 10); return Number.isFinite(n) ? n : null; };
const moneyOrNull = (v: string) => (v.trim() ? parseMoneyInput(v) : null);

function toPayload(f: PromotionFormInitial): PromotionPayload {
  const pct = Number.parseFloat(f.valueBps.replace(",", "."));
  return {
    id: f.id, name: f.name, description: f.description, type: f.type, scope: f.scope,
    valueBps: Number.isFinite(pct) ? Math.round(pct * 100) : null, valueAmount: moneyOrNull(f.valueAmount), specialPrice: moneyOrNull(f.specialPrice), minQuantity: intOrNull(f.minQuantity), minOrderAmount: moneyOrNull(f.minOrderAmount),
    isAutomatic: f.isAutomatic, isActive: f.isActive, startsAt: f.startsAt || null, endsAt: f.endsAt || null, maxUses: intOrNull(f.maxUses), maxUsesPerCustomer: intOrNull(f.maxUsesPerCustomer), customerGroupId: f.customerGroupId || null, priority: intOrNull(f.priority) ?? 0, showBadge: f.showBadge, badgeLabel: f.badgeLabel,
    productSkus: f.productSkus.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean), categoryIds: f.categoryIds, brandIds: f.brandIds,
    coupons: f.coupons.filter((c) => c.code.trim()).map((c) => ({ code: c.code.trim().toUpperCase(), maxUses: intOrNull(c.maxUses), isActive: c.isActive, startsAt: c.startsAt || null, endsAt: c.endsAt || null })),
  };
}

/** Formulaire promotion : règle, période, cibles par portée, codes promo. */
export function PromotionForm({ initial, refs }: { initial?: PromotionFormInitial; refs: PromotionRefs }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = React.useState<PromotionFormInitial>(() => initial ?? empty());
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const set = (patch: Partial<PromotionFormInitial>) => setForm((f) => ({ ...f, ...patch }));
  const err = (k: string) => (errors[k] ? t("common.errors.validation") : undefined);
  const usesBps = form.type === "PERCENTAGE" || form.type === "QUANTITY" || form.type === "BUNDLE";
  const usesMinQty = form.type === "QUANTITY" || form.type === "BUNDLE";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await promotionSaveAction(toPayload(form));
      if (r.ok) { toast.success(r.message ?? ""); setError(null); setErrors({}); if (!form.id && r.data) router.push(`/admin/promotions/${r.data.id}`); else router.refresh(); }
      else { setError(r.error); setErrors(r.fieldErrors ?? {}); }
    });
  };
  const toggleId = (field: "categoryIds" | "brandIds", id: string, on: boolean) => set({ [field]: on ? [...new Set([...form[field], id])] : form[field].filter((x) => x !== id) } as Partial<PromotionFormInitial>);
  const setCoupon = (i: number, patch: Partial<CouponState>) => set({ coupons: form.coupons.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <section className="space-y-4 rounded-lg border border-border bg-surface p-4 md:p-6">
          <FormError message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="pr-name" label={t("admin.promotions.form.name")} required error={err("name")} className="sm:col-span-2"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field id="pr-type" label={t("admin.promotions.form.type")} error={err("type")}><Select value={form.type} onChange={(e) => set({ type: e.target.value as PromoType })}>{TYPES.map((ty) => <option key={ty} value={ty}>{t.enum("admin.promotions.form.types", ty)}</option>)}</Select></Field>
            <Field id="pr-scope" label={t("admin.promotions.form.scope")} error={errors.scope ? t("admin.promotions.form.scopeTypeMismatch") : undefined}><Select value={form.scope} onChange={(e) => set({ scope: e.target.value as PromoScope })}>{SCOPES.map((s) => <option key={s} value={s}>{t.enum("admin.promotions.form.scopes", s)}</option>)}</Select></Field>
            {usesBps && <Field id="pr-bps" label={t("admin.promotions.form.valueBps")} required error={errors.valueBps ? t("admin.promotions.form.valueRequired") : undefined}><Input inputMode="decimal" value={form.valueBps} onChange={(e) => set({ valueBps: e.target.value })} placeholder="10" className="tnum" /></Field>}
            {form.type === "FIXED_AMOUNT" && <Field id="pr-amount" label={t("admin.promotions.form.valueAmount")} required error={errors.valueAmount ? t("admin.promotions.form.valueRequired") : undefined}><Input inputMode="decimal" value={form.valueAmount} onChange={(e) => set({ valueAmount: e.target.value })} placeholder="0,00" className="tnum" /></Field>}
            {(form.type === "SPECIAL_PRICE" || form.type === "CLEARANCE") && <Field id="pr-special" label={t("admin.promotions.form.specialPrice")} required error={errors.specialPrice ? t("admin.promotions.form.valueRequired") : undefined}><Input inputMode="decimal" value={form.specialPrice} onChange={(e) => set({ specialPrice: e.target.value })} placeholder="0,00" className="tnum" /></Field>}
            <Field id="pr-minq" label={t("admin.promotions.form.minQuantity")} required={usesMinQty} error={errors.minQuantity ? t("admin.promotions.form.valueRequired") : undefined}><Input type="number" min={1} value={form.minQuantity} onChange={(e) => set({ minQuantity: e.target.value })} /></Field>
            <Field id="pr-minorder" label={t("admin.promotions.form.minOrderAmount")}><Input inputMode="decimal" value={form.minOrderAmount} onChange={(e) => set({ minOrderAmount: e.target.value })} placeholder="0,00" className="tnum" /></Field>
            <Field id="pr-desc" label={t("admin.promotions.form.description")} className="sm:col-span-2"><Textarea rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} /></Field>
          </div>
        </section>

        {form.scope !== "ORDER" && (
          <section className="space-y-3 rounded-lg border border-border bg-surface p-4 md:p-6">
            <h2 className="t-h4">{t("admin.promotions.form.targets")}</h2>
            {form.scope === "PRODUCT" && <Field id="pr-skus" label={t("admin.promotions.form.products")} hint={t("admin.promotions.form.productsHint")} error={errors.productSkus ? (errors.productSkus[0] === "targets_required" ? t("admin.promotions.form.targetsRequired") : t("admin.promotions.form.unknownSkus", { skus: errors.productSkus.join(", ") })) : undefined}><Textarea rows={5} value={form.productSkus} onChange={(e) => set({ productSkus: e.target.value })} className="font-mono text-sm uppercase" /></Field>}
            {form.scope === "CATEGORY" && (
              <div>
                <p className="mb-2 text-sm font-medium">{t("admin.promotions.form.categories")}</p>
                {errors.categoryIds && <p className="mb-2 text-xs text-error">{t("admin.promotions.form.targetsRequired")}</p>}
                <div className="max-h-80 space-y-1.5 overflow-y-auto rounded-md border border-border p-3">{refs.categories.map((c) => <div key={c.id} style={{ paddingInlineStart: `${Math.min(c.level, 4) * 16}px` }}><CheckboxField id={`pr-cat-${c.id}`} label={c.name} checked={form.categoryIds.includes(c.id)} onCheckedChange={(on) => toggleId("categoryIds", c.id, on === true)} /></div>)}</div>
              </div>
            )}
            {form.scope === "BRAND" && (
              <div>
                <p className="mb-2 text-sm font-medium">{t("admin.promotions.form.brands")}</p>
                {errors.brandIds && <p className="mb-2 text-xs text-error">{t("admin.promotions.form.targetsRequired")}</p>}
                <div className="grid max-h-80 gap-1.5 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">{refs.brands.map((b) => <CheckboxField key={b.id} id={`pr-brand-${b.id}`} label={b.name} checked={form.brandIds.includes(b.id)} onCheckedChange={(on) => toggleId("brandIds", b.id, on === true)} />)}</div>
              </div>
            )}
          </section>
        )}

        <section className="space-y-3 rounded-lg border border-border bg-surface p-4 md:p-6">
          <div className="flex items-center justify-between"><h2 className="t-h4">{t("admin.promotions.form.coupons")}</h2><Button type="button" size="sm" variant="outline" onClick={() => set({ coupons: [...form.coupons, { key: newKey(), code: "", maxUses: "", isActive: true, startsAt: "", endsAt: "" }] })}><Plus />{t("admin.promotions.form.addCoupon")}</Button></div>
          {errors.coupons && <p className="text-xs text-error">{errors.coupons[0] === "coupon_required" ? t("admin.promotions.form.couponRequired") : t("admin.promotions.form.couponTaken", { code: errors.coupons[0] })}</p>}
          {form.coupons.length === 0 && <p className="text-sm text-muted">{t("admin.promotions.form.noCoupons")}</p>}
          {form.coupons.map((c, i) => (
            <div key={c.key} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_110px_1fr_1fr_auto_auto] sm:items-end">
              <Field id={`cp-code-${c.key}`} label={t("admin.promotions.form.couponCode")} hint={c.usesCount !== undefined ? t("admin.promotions.form.couponUses", { count: c.usesCount }) : undefined}><Input value={c.code} onChange={(e) => setCoupon(i, { code: e.target.value.toUpperCase() })} className="h-9 font-mono text-sm uppercase" /></Field>
              <Field id={`cp-max-${c.key}`} label={t("admin.promotions.form.maxUses")}><Input type="number" min={1} value={c.maxUses} onChange={(e) => setCoupon(i, { maxUses: e.target.value })} placeholder="∞" className="h-9 text-sm" /></Field>
              <Field id={`cp-start-${c.key}`} label={t("admin.promotions.form.couponStartsAt")}><Input type="datetime-local" value={c.startsAt} onChange={(e) => setCoupon(i, { startsAt: e.target.value })} className="h-9 text-sm" /></Field>
              <Field id={`cp-end-${c.key}`} label={t("admin.promotions.form.couponEndsAt")}><Input type="datetime-local" value={c.endsAt} onChange={(e) => setCoupon(i, { endsAt: e.target.value })} className="h-9 text-sm" /></Field>
              <label className="flex items-center gap-2 pb-2 text-sm"><Switch checked={c.isActive} onCheckedChange={(on) => setCoupon(i, { isActive: on })} />{t("admin.promotions.form.couponActive")}</label>
              <IconButton size="icon-sm" label={t("common.actions.delete")} className="mb-1" onClick={() => set({ coupons: form.coupons.filter((_, j) => j !== i) })}><Trash2 /></IconButton>
            </div>
          ))}
        </section>
        <div className="flex justify-end"><Button type="submit" loading={pending}>{t("common.actions.save")}</Button></div>
      </div>

      <aside className="space-y-3 self-start rounded-lg border border-border bg-surface p-4">
        <label className="flex items-center justify-between gap-3 text-sm"><span>{t("admin.promotions.form.isActive")}</span><Switch checked={form.isActive} onCheckedChange={(on) => set({ isActive: on })} /></label>
        <label className="flex items-start justify-between gap-3 text-sm"><span>{t("admin.promotions.form.isAutomatic")}<span className="block text-xs text-muted">{t("admin.promotions.form.isAutomaticHint")}</span></span><Switch checked={form.isAutomatic} onCheckedChange={(on) => set({ isAutomatic: on })} /></label>
        <Field id="pr-start" label={t("admin.promotions.form.startsAt")} error={err("startsAt")}><Input type="datetime-local" value={form.startsAt} onChange={(e) => set({ startsAt: e.target.value })} /></Field>
        <Field id="pr-end" label={t("admin.promotions.form.endsAt")} error={errors.endsAt ? t("admin.promotions.form.datesInvalid") : undefined}><Input type="datetime-local" value={form.endsAt} onChange={(e) => set({ endsAt: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="pr-max" label={t("admin.promotions.form.maxUses")}><Input type="number" min={1} value={form.maxUses} onChange={(e) => set({ maxUses: e.target.value })} placeholder="∞" /></Field>
          <Field id="pr-maxc" label={t("admin.promotions.form.maxUsesPerCustomer")}><Input type="number" min={1} value={form.maxUsesPerCustomer} onChange={(e) => set({ maxUsesPerCustomer: e.target.value })} placeholder="∞" /></Field>
        </div>
        <Field id="pr-group" label={t("admin.promotions.form.customerGroup")}><Select value={form.customerGroupId} onChange={(e) => set({ customerGroupId: e.target.value })}><option value="">{t("admin.promotions.form.allGroups")}</option>{refs.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Field>
        <Field id="pr-priority" label={t("admin.promotions.form.priority")}><Input type="number" value={form.priority} onChange={(e) => set({ priority: e.target.value })} /></Field>
        <label className="flex items-center justify-between gap-3 text-sm"><span>{t("admin.promotions.form.showBadge")}</span><Switch checked={form.showBadge} onCheckedChange={(on) => set({ showBadge: on })} /></label>
        {form.showBadge && <Field id="pr-badge" label={t("admin.promotions.form.badgeLabel")}><Input value={form.badgeLabel} maxLength={40} onChange={(e) => set({ badgeLabel: e.target.value })} placeholder="-10 %" /></Field>}
      </aside>
    </form>
  );
}
