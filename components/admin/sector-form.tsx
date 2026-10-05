"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { CheckboxField, Switch } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { AdminCard } from "@/components/admin/ui";
import { sectorSaveAction, sectorDeleteAction } from "@/app/actions/admin/content";

export interface SectorFormData { id: string; name: string; slug: string; heroTitle: string; heroSubtitle: string | null; description: string | null; image: string | null; icon: string | null; sortOrder: number; isActive: boolean; seoTitle: string | null; seoDescription: string | null; categoryIds: string[]; productSkus: string[] }
export interface CategoryOption { id: string; name: string; path: string; level: number }

export function SectorForm({ sector, categories }: { sector?: SectorFormData; categories: CategoryOption[] }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = React.useState({ name: sector?.name ?? "", slug: sector?.slug ?? "", heroTitle: sector?.heroTitle ?? "", heroSubtitle: sector?.heroSubtitle ?? "", description: sector?.description ?? "", image: sector?.image ?? "", icon: sector?.icon ?? "", sortOrder: String(sector?.sortOrder ?? 0), isActive: sector?.isActive ?? true, seoTitle: sector?.seoTitle ?? "", seoDescription: sector?.seoDescription ?? "", categoryIds: sector?.categoryIds ?? [], productSkus: sector?.productSkus.join(", ") ?? "" });
  const [slugTouched, setSlugTouched] = React.useState(!!sector);
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string[]>>({});
  const [pending, start] = React.useTransition();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggleCategory = (id: string, checked: boolean) => set("categoryIds", checked ? [...form.categoryIds, id] : form.categoryIds.filter((c) => c !== id));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await sectorSaveAction({ id: sector?.id, ...form, slug: form.slug || slugify(form.name), sortOrder: Number(form.sortOrder) });
      if (r.ok) { toast.success(r.message ?? ""); setError(null); setFe({}); if (!sector && r.data) router.replace(`/admin/sectors/${r.data.id}`); } else { setError(r.error); setFe(r.fieldErrors ?? {}); }
    });
  };
  const remove = () => { if (!sector || !window.confirm(t("admin.cms.sectors.deleteConfirm"))) return; start(async () => { const r = await sectorDeleteAction({ id: sector.id }); if (r.ok) { toast.success(r.message ?? ""); router.replace("/admin/sectors"); } else toast.error(r.error); }); };
  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <FormError message={error} />
        <AdminCard title={t("admin.cms.sectors.form.general")}>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="s-name" label={t("admin.cms.sectors.form.name")} required error={fe.name}><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))} /></Field>
              <Field id="s-slug" label={t("admin.cms.sectors.form.slug")} required hint={t("admin.cms.sectors.form.slugHint", { slug: form.slug || "…" })} error={fe.slug}><Input value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} className="font-mono text-xs" /></Field>
            </div>
            <Field id="s-hero" label={t("admin.cms.sectors.form.heroTitle")} required error={fe.heroTitle}><Input value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} /></Field>
            <Field id="s-herosub" label={t("admin.cms.sectors.form.heroSubtitle")} error={fe.heroSubtitle}><Input value={form.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} /></Field>
            <Field id="s-desc" label={t("admin.cms.sectors.form.description")} error={fe.description}><Textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px_100px]">
              <Field id="s-image" label={t("admin.cms.sectors.form.image")} error={fe.image}><Input value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" /></Field>
              <Field id="s-icon" label={t("admin.cms.sectors.form.icon")} hint={t("admin.cms.sectors.form.iconHint")} error={fe.icon}><Input value={form.icon} onChange={(e) => set("icon", e.target.value)} /></Field>
              <Field id="s-order" label={t("admin.cms.sectors.form.sortOrder")} error={fe.sortOrder}><Input type="number" min={0} value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></Field>
            </div>
          </div>
        </AdminCard>
        <AdminCard title={t("admin.cms.sectors.form.products")}>
          <Field id="s-skus" label={t("admin.cms.sectors.form.products")} hint={t("admin.cms.sectors.form.productsHint")} error={fe.productSkus}><Textarea rows={3} value={form.productSkus} onChange={(e) => set("productSkus", e.target.value)} className="font-mono text-xs uppercase" /></Field>
        </AdminCard>
        <AdminCard title={t("admin.cms.sectors.form.seo")}>
          <div className="space-y-3">
            <Field id="s-seotitle" label={t("admin.cms.sectors.form.seoTitle")} error={fe.seoTitle}><Input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={160} /></Field>
            <Field id="s-seodesc" label={t("admin.cms.sectors.form.seoDescription")} error={fe.seoDescription}><Textarea rows={3} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} maxLength={320} /></Field>
          </div>
        </AdminCard>
      </div>
      <div className="space-y-6">
        <AdminCard>
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3 text-sm"><span>{t("admin.cms.sectors.form.isActive")}</span><Switch checked={form.isActive} onCheckedChange={(c) => set("isActive", c)} /></label>
            <Button type="submit" loading={pending} fullWidth>{t("common.actions.save")}</Button>
            {sector && <Button type="button" variant="danger-outline" size="sm" fullWidth disabled={pending} onClick={remove}><Trash2 />{t("common.actions.delete")}</Button>}
          </div>
        </AdminCard>
        <AdminCard title={t("admin.cms.sectors.form.categories")}>
          {categories.length ? (
            <div className="max-h-96 space-y-2 overflow-y-auto pe-1">
              {categories.map((c) => <div key={c.id} style={{ paddingInlineStart: `${c.level * 16}px` }}><CheckboxField id={`s-cat-${c.id}`} label={c.name} description={c.path} checked={form.categoryIds.includes(c.id)} onCheckedChange={(v) => toggleCategory(c.id, v === true)} /></div>)}
            </div>
          ) : <p className="text-sm text-muted">{t("admin.cms.sectors.form.noCategories")}</p>}
          {fe.categoryIds && <p className="mt-2 text-xs text-error">{fe.categoryIds[0]}</p>}
        </AdminCard>
      </div>
    </form>
  );
}
