"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { slugify } from "@/lib/utils";
import { Button, IconButton } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { Switch } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { brandSaveAction, brandDeleteAction, type BrandPayload } from "@/app/actions/admin/catalog";

type FormState = Omit<BrandPayload, "sortOrder"> & { sortOrder: string };

/** Formulaire marque (création / édition). */
export function BrandForm({ initial }: { initial?: Partial<Omit<FormState, "sortOrder">> & { id?: string; sortOrder?: number } }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [slugTouched, setSlugTouched] = React.useState(!!initial?.id);
  const [form, setForm] = React.useState<FormState>({ id: initial?.id, name: initial?.name ?? "", slug: initial?.slug ?? "", description: initial?.description ?? "", logo: initial?.logo ?? "", website: initial?.website ?? "", isActive: initial?.isActive ?? true, isFeatured: initial?.isFeatured ?? false, sortOrder: String(initial?.sortOrder ?? 0), seoTitle: initial?.seoTitle ?? "", seoDescription: initial?.seoDescription ?? "" });
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await brandSaveAction({ ...form, sortOrder: Number.parseInt(form.sortOrder, 10) || 0 });
      if (r.ok) { toast.success(r.message ?? ""); setError(null); setErrors({}); if (!form.id && r.data) router.push(`/admin/brands/${r.data.id}`); else router.refresh(); }
      else { setError(r.error); setErrors(r.fieldErrors ?? {}); }
    });
  };
  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4 rounded-lg border border-border bg-surface p-4 md:p-6">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="b-name" label={t("admin.brands.form.name")} required error={errors.name ? t("common.errors.required") : undefined}><Input value={form.name} onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} /></Field>
          <Field id="b-slug" label={t("admin.brands.form.slug")} required error={errors.slug ? t("admin.brands.form.slugTaken") : undefined}><Input value={form.slug} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) || e.target.value.toLowerCase() }); }} className="font-mono text-sm" /></Field>
        </div>
        <Field id="b-desc" label={t("admin.brands.form.description")}><Textarea rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="b-logo" label={t("admin.brands.form.logo")}><Input value={form.logo} onChange={(e) => set({ logo: e.target.value })} placeholder={t("admin.common.imagePathPlaceholder")} /></Field>
          <Field id="b-site" label={t("admin.brands.form.website")} error={errors.website ? t("common.errors.validation") : undefined}><Input type="url" value={form.website} onChange={(e) => set({ website: e.target.value })} placeholder="https://" /></Field>
        </div>
        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-semibold">{t("admin.products.form.seo")}</legend>
          <div className="space-y-3">
            <Field id="b-seo-title" label={t("common.labels.seoTitle")}><Input value={form.seoTitle} maxLength={160} onChange={(e) => set({ seoTitle: e.target.value })} /></Field>
            <Field id="b-seo-desc" label={t("common.labels.seoDescription")}><Textarea rows={3} value={form.seoDescription} maxLength={320} onChange={(e) => set({ seoDescription: e.target.value })} /></Field>
          </div>
        </fieldset>
        <div className="flex justify-end"><Button type="submit" loading={pending}>{t("common.actions.save")}</Button></div>
      </div>
      <aside className="space-y-3 rounded-lg border border-border bg-surface p-4 self-start">
        <Field id="b-order" label={t("admin.brands.form.sortOrder")}><Input type="number" min={0} value={form.sortOrder} onChange={(e) => set({ sortOrder: e.target.value })} /></Field>
        <label className="flex items-center justify-between gap-3 text-sm"><span>{t("admin.brands.form.isActive")}</span><Switch checked={form.isActive} onCheckedChange={(c) => set({ isActive: c })} /></label>
        <label className="flex items-center justify-between gap-3 text-sm"><span>{t("admin.brands.form.isFeatured")}</span><Switch checked={form.isFeatured} onCheckedChange={(c) => set({ isFeatured: c })} /></label>
      </aside>
    </form>
  );
}

/** Bouton de suppression (bloqué côté serveur si des produits sont rattachés). */
export function BrandDeleteButton({ id, icon, afterDelete }: { id: string; icon?: boolean; afterDelete?: "list" | "refresh" }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const run = () => {
    if (!window.confirm(t("admin.brands.form.deleteConfirm"))) return;
    start(async () => { const r = await brandDeleteAction({ id }); if (r.ok) { toast.success(r.message ?? ""); if (afterDelete === "list") router.push("/admin/brands"); else router.refresh(); } else toast.error(r.error); });
  };
  if (icon) return <IconButton size="icon-sm" label={t("common.actions.delete")} disabled={pending} onClick={run}><Trash2 /></IconButton>;
  return <Button size="sm" variant="danger-outline" loading={pending} onClick={run}><Trash2 />{t("common.actions.delete")}</Button>;
}
