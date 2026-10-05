"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { AdminCard } from "@/components/admin/ui";
import { MarkdownEditor } from "./page-markdown";
import { CONTENT_STATUSES, type ContentStatus } from "./page-editor";
import { guideSaveAction, guideDeleteAction, blogCategoryAction } from "@/app/actions/admin/content";

export interface GuideFormData { id: string; title: string; slug: string; excerpt: string | null; content: string; image: string | null; categoryId: string | null; authorName: string | null; readingMinutes: number; status: ContentStatus; publishedAt: string | null; productSkus: string[]; seoTitle: string | null; seoDescription: string | null }
export interface GuideCategoryOption { id: string; name: string }

function NewCategoryForm({ onCreated, onCancel }: { onCreated: (c: GuideCategoryOption) => void; onCancel: () => void }) {
  const t = useT();
  const toast = useToast();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const create = () => start(async () => { const r = await blogCategoryAction({ name }); if (r.ok && r.data) { toast.success(r.message ?? ""); onCreated(r.data); } else if (!r.ok) setError(r.fieldErrors?.slug?.[0] ?? r.fieldErrors?.name?.[0] ?? r.error); });
  return (
    <div className="rounded-md border border-border bg-paper p-3">
      <Field id="g-newcat" label={t("admin.cms.guides.categoryForm.name")} error={error}><Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); create(); } }} className="h-9 text-sm" /></Field>
      <div className="mt-2 flex gap-2">
        <Button type="button" size="sm" loading={pending} disabled={name.trim().length < 2} onClick={create}>{t("common.actions.create")}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>{t("admin.cms.guides.categoryForm.cancel")}</Button>
      </div>
    </div>
  );
}

export function GuideEditor({ guide, categories: initialCategories, defaultAuthor }: { guide?: GuideFormData; categories: GuideCategoryOption[]; defaultAuthor: string }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [categories, setCategories] = React.useState(initialCategories);
  const [newCat, setNewCat] = React.useState(false);
  const [form, setForm] = React.useState({ title: guide?.title ?? "", slug: guide?.slug ?? "", excerpt: guide?.excerpt ?? "", content: guide?.content ?? "", image: guide?.image ?? "", categoryId: guide?.categoryId ?? "", authorName: guide?.authorName ?? defaultAuthor, readingMinutes: String(guide?.readingMinutes ?? 4), status: guide?.status ?? ("DRAFT" as ContentStatus), publishedAt: guide?.publishedAt ?? "", productSkus: guide?.productSkus.join(", ") ?? "", seoTitle: guide?.seoTitle ?? "", seoDescription: guide?.seoDescription ?? "" });
  const [slugTouched, setSlugTouched] = React.useState(!!guide);
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string[]>>({});
  const [pending, start] = React.useTransition();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await guideSaveAction({ id: guide?.id, ...form, slug: form.slug || slugify(form.title), categoryId: form.categoryId || null, readingMinutes: Number(form.readingMinutes) });
      if (r.ok) { toast.success(r.message ?? ""); setError(null); setFe({}); if (!guide && r.data) router.replace(`/admin/guides/${r.data.id}`); } else { setError(r.error); setFe(r.fieldErrors ?? {}); }
    });
  };
  const remove = () => { if (!guide || !window.confirm(t("admin.cms.guides.deleteConfirm"))) return; start(async () => { const r = await guideDeleteAction({ id: guide.id }); if (r.ok) { toast.success(r.message ?? ""); router.replace("/admin/guides"); } else toast.error(r.error); }); };
  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <FormError message={error} />
        <AdminCard title={t("admin.cms.guides.general")}>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="g-title" label={t("admin.cms.guides.form.title")} required error={fe.title}><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))} /></Field>
              <Field id="g-slug" label={t("admin.cms.guides.form.slug")} required hint={t("admin.cms.guides.slugHint", { slug: form.slug || "…" })} error={fe.slug}><Input value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} className="font-mono text-xs" /></Field>
            </div>
            <Field id="g-excerpt" label={t("admin.cms.guides.form.excerpt")} error={fe.excerpt}><Textarea rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} maxLength={500} /></Field>
            <Field id="g-image" label={t("admin.cms.guides.form.image")} error={fe.image}><Input value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" /></Field>
            <MarkdownEditor id="g-content" label={t("admin.cms.guides.form.content")} previewLabel={t("admin.cms.guides.preview")} value={form.content} onChange={(v) => set("content", v)} error={fe.content} />
          </div>
        </AdminCard>
        <AdminCard title={t("admin.cms.guides.form.products")}>
          <Field id="g-skus" label={t("admin.cms.guides.form.products")} hint={t("admin.cms.guides.productsHint")} error={fe.productSkus}><Textarea rows={2} value={form.productSkus} onChange={(e) => set("productSkus", e.target.value)} className="font-mono text-xs uppercase" /></Field>
        </AdminCard>
        <AdminCard title={t("admin.cms.guides.seo")}>
          <div className="space-y-3">
            <Field id="g-seotitle" label={t("admin.cms.guides.form.seoTitle")} error={fe.seoTitle}><Input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={160} /></Field>
            <Field id="g-seodesc" label={t("admin.cms.guides.form.seoDescription")} error={fe.seoDescription}><Textarea rows={3} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} maxLength={320} /></Field>
          </div>
        </AdminCard>
      </div>
      <div className="space-y-6">
        <AdminCard title={t("admin.cms.guides.settings")}>
          <div className="space-y-3">
            <Field id="g-status" label={t("admin.cms.guides.form.status")} error={fe.status}><Select value={form.status} onChange={(e) => set("status", e.target.value as ContentStatus)}>{CONTENT_STATUSES.map((s) => <option key={s} value={s}>{t.enum("common.status.content", s)}</option>)}</Select></Field>
            <Field id="g-published" label={t("admin.cms.guides.form.publishedAt")} error={fe.publishedAt}><Input type="date" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} /></Field>
            <Field id="g-category" label={t("admin.cms.guides.form.category")} error={fe.categoryId}><Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}><option value="">{t("admin.cms.guides.noCategory")}</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
            {newCat ? <NewCategoryForm onCreated={(c) => { setCategories((cs) => [...cs, c]); set("categoryId", c.id); setNewCat(false); }} onCancel={() => setNewCat(false)} /> : <Button type="button" size="sm" variant="link" onClick={() => setNewCat(true)}><Plus />{t("admin.cms.guides.addCategory")}</Button>}
            <Field id="g-author" label={t("admin.cms.guides.form.authorName")} error={fe.authorName}><Input value={form.authorName} onChange={(e) => set("authorName", e.target.value)} /></Field>
            <Field id="g-minutes" label={t("admin.cms.guides.form.readingMinutes")} error={fe.readingMinutes}><Input type="number" min={1} max={180} value={form.readingMinutes} onChange={(e) => set("readingMinutes", e.target.value)} /></Field>
            <Button type="submit" loading={pending} fullWidth>{t("common.actions.save")}</Button>
            {guide && <Button type="button" variant="danger-outline" size="sm" fullWidth disabled={pending} onClick={remove}><Trash2 />{t("common.actions.delete")}</Button>}
          </div>
        </AdminCard>
      </div>
    </form>
  );
}
