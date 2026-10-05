"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { CheckboxField, Switch } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { categorySaveAction, categoryDeleteAction, type CategoryPayload } from "@/app/actions/admin/catalog";

export interface CategoryOption { id: string; name: string; level: number; parentId: string | null }
export interface AttributeOption { id: string; code: string; name: string }

type FormState = Omit<CategoryPayload, "sortOrder"> & { sortOrder: string };

/** Formulaire catégorie (création / édition). Le parent exclut la catégorie et ses descendants. */
export function CategoryForm({ initial, categories, attributes }: { initial?: Partial<Omit<FormState, "sortOrder">> & { id?: string; sortOrder?: number }; categories: CategoryOption[]; attributes: AttributeOption[] }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [slugTouched, setSlugTouched] = React.useState(!!initial?.id);
  const [form, setForm] = React.useState<FormState>({ id: initial?.id, name: initial?.name ?? "", slug: initial?.slug ?? "", parentId: initial?.parentId ?? null, description: initial?.description ?? "", image: initial?.image ?? "", icon: initial?.icon ?? "", sortOrder: String(initial?.sortOrder ?? 0), isVisible: initial?.isVisible ?? true, showInNav: initial?.showInNav ?? false, seoTitle: initial?.seoTitle ?? "", seoDescription: initial?.seoDescription ?? "", attributeIds: initial?.attributeIds ?? [] });
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const excluded = React.useMemo(() => {
    const out = new Set<string>();
    if (!form.id) return out;
    const children = new Map<string | null, CategoryOption[]>();
    for (const c of categories) (children.get(c.parentId) ?? children.set(c.parentId, []).get(c.parentId)!).push(c);
    const stack = [form.id];
    while (stack.length) { const id = stack.pop()!; out.add(id); for (const ch of children.get(id) ?? []) stack.push(ch.id); }
    return out;
  }, [categories, form.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await categorySaveAction({ ...form, sortOrder: Number.parseInt(form.sortOrder, 10) || 0, parentId: form.parentId || null });
      if (r.ok) { toast.success(r.message ?? ""); setError(null); setErrors({}); if (!form.id && r.data) router.push(`/admin/categories/${r.data.id}`); else router.refresh(); }
      else { setError(r.error); setErrors(r.fieldErrors ?? {}); }
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4 rounded-lg border border-border bg-surface p-4 md:p-6">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="c-name" label={t("admin.categories.form.name")} required error={errors.name ? t("common.errors.required") : undefined}><Input value={form.name} onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} /></Field>
          <Field id="c-slug" label={t("admin.categories.form.slug")} required error={errors.slug ? t("admin.categories.form.slugTaken") : undefined}><Input value={form.slug} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) || e.target.value.toLowerCase() }); }} className="font-mono text-sm" /></Field>
        </div>
        <Field id="c-parent" label={t("admin.categories.form.parent")} error={errors.parentId ? t("admin.categories.form.cycle") : undefined}>
          <Select value={form.parentId ?? ""} onChange={(e) => set({ parentId: e.target.value || null })}>
            <option value="">{t("admin.categories.form.noParent")}</option>
            {categories.filter((c) => !excluded.has(c.id)).map((c) => <option key={c.id} value={c.id}>{`${"  ".repeat(c.level)}${c.level ? "↳ " : ""}${c.name}`}</option>)}
          </Select>
        </Field>
        <Field id="c-desc" label={t("admin.categories.form.description")}><Textarea rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="c-image" label={t("admin.categories.form.image")}><Input value={form.image} onChange={(e) => set({ image: e.target.value })} placeholder={t("admin.common.imagePathPlaceholder")} /></Field>
          <Field id="c-icon" label={t("admin.categories.form.icon")} hint={t("admin.categories.form.iconHint")}><Input value={form.icon} onChange={(e) => set({ icon: e.target.value })} className="font-mono text-sm" /></Field>
        </div>
        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-semibold">{t("admin.products.form.seo")}</legend>
          <div className="space-y-3">
            <Field id="c-seo-title" label={t("admin.categories.form.seoTitle")}><Input value={form.seoTitle} maxLength={160} onChange={(e) => set({ seoTitle: e.target.value })} /></Field>
            <Field id="c-seo-desc" label={t("admin.categories.form.seoDescription")}><Textarea rows={3} value={form.seoDescription} maxLength={320} onChange={(e) => set({ seoDescription: e.target.value })} /></Field>
          </div>
        </fieldset>
        <div className="flex justify-end"><Button type="submit" loading={pending}>{t("common.actions.save")}</Button></div>
      </div>
      <aside className="space-y-4">
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <Field id="c-order" label={t("admin.categories.form.sortOrder")}><Input type="number" min={0} value={form.sortOrder} onChange={(e) => set({ sortOrder: e.target.value })} /></Field>
          <label className="flex items-center justify-between gap-3 text-sm"><span>{t("admin.categories.form.isVisible")}</span><Switch checked={form.isVisible} onCheckedChange={(c) => set({ isVisible: c })} /></label>
          <label className="flex items-center justify-between gap-3 text-sm"><span>{t("admin.categories.form.showInNav")}</span><Switch checked={form.showInNav} onCheckedChange={(c) => set({ showInNav: c })} /></label>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm font-semibold">{t("admin.categories.form.attributes")}</p>
          <p className="mb-3 text-xs text-muted">{t("admin.categories.form.attributesHint")}</p>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {attributes.map((a) => <CheckboxField key={a.id} id={`c-attr-${a.id}`} label={a.name} description={a.code} checked={form.attributeIds.includes(a.id)} onCheckedChange={(c) => set({ attributeIds: c === true ? [...form.attributeIds, a.id] : form.attributeIds.filter((x) => x !== a.id) })} />)}
            {!attributes.length && <p className="text-sm text-muted">{t("admin.common.noData")}</p>}
          </div>
        </div>
      </aside>
    </form>
  );
}

export function CategoryDeleteButton({ id }: { id: string }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Button size="sm" variant="danger-outline" loading={pending} onClick={() => { if (!window.confirm(t("admin.categories.form.deleteConfirm"))) return; start(async () => { const r = await categoryDeleteAction({ id }); if (r.ok) { toast.success(r.message ?? ""); router.push("/admin/categories"); } else toast.error(r.error); }); }}>
      <Trash2 />{t("common.actions.delete")}
    </Button>
  );
}
