"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { Switch } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { AdminCard } from "@/components/admin/ui";
import { MarkdownEditor } from "./page-markdown";
import { cmsPageSaveAction, cmsPageDeleteAction } from "@/app/actions/admin/content";

export const CONTENT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export interface CmsPageFormData { id: string; title: string; slug: string; excerpt: string | null; content: string; status: ContentStatus; showInFooter: boolean; seoTitle: string | null; seoDescription: string | null }

export function PageEditor({ page }: { page?: CmsPageFormData }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = React.useState({ title: page?.title ?? "", slug: page?.slug ?? "", excerpt: page?.excerpt ?? "", content: page?.content ?? "", status: page?.status ?? ("DRAFT" as ContentStatus), showInFooter: page?.showInFooter ?? false, seoTitle: page?.seoTitle ?? "", seoDescription: page?.seoDescription ?? "" });
  const [slugTouched, setSlugTouched] = React.useState(!!page);
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string[]>>({});
  const [pending, start] = React.useTransition();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await cmsPageSaveAction({ id: page?.id, ...form, slug: form.slug || slugify(form.title) });
      if (r.ok) { toast.success(r.message ?? ""); setError(null); setFe({}); if (!page && r.data) router.replace(`/admin/pages/${r.data.id}`); } else { setError(r.error); setFe(r.fieldErrors ?? {}); }
    });
  };
  const remove = () => { if (!page || !window.confirm(t("admin.cms.pages.deleteConfirm"))) return; start(async () => { const r = await cmsPageDeleteAction({ id: page.id }); if (r.ok) { toast.success(r.message ?? ""); router.replace("/admin/pages"); } else toast.error(r.error); }); };
  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <FormError message={error} />
        <AdminCard title={t("admin.cms.pages.form.general")}>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="p-title" label={t("admin.cms.pages.form.title")} required error={fe.title}><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))} /></Field>
              <Field id="p-slug" label={t("admin.cms.pages.form.slug")} required hint={t("admin.cms.pages.form.slugHint", { slug: form.slug || "…" })} error={fe.slug}><Input value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} className="font-mono text-xs" /></Field>
            </div>
            <Field id="p-excerpt" label={t("admin.cms.pages.form.excerpt")} error={fe.excerpt}><Textarea rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} maxLength={500} /></Field>
            <MarkdownEditor id="p-content" label={t("admin.cms.pages.form.content")} previewLabel={t("admin.cms.pages.form.preview")} value={form.content} onChange={(v) => set("content", v)} error={fe.content} />
          </div>
        </AdminCard>
        <AdminCard title={t("admin.cms.pages.form.seo")}>
          <div className="space-y-3">
            <Field id="p-seotitle" label={t("admin.cms.pages.form.seoTitle")} error={fe.seoTitle}><Input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={160} /></Field>
            <Field id="p-seodesc" label={t("admin.cms.pages.form.seoDescription")} error={fe.seoDescription}><Textarea rows={3} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} maxLength={320} /></Field>
          </div>
        </AdminCard>
      </div>
      <div className="space-y-6">
        <AdminCard title={t("admin.cms.pages.form.settings")}>
          <div className="space-y-3">
            <Field id="p-status" label={t("admin.cms.pages.form.status")} error={fe.status}><Select value={form.status} onChange={(e) => set("status", e.target.value as ContentStatus)}>{CONTENT_STATUSES.map((s) => <option key={s} value={s}>{t.enum("common.status.content", s)}</option>)}</Select></Field>
            <label className="flex items-center justify-between gap-3 text-sm"><span>{t("admin.cms.pages.form.showInFooter")}</span><Switch checked={form.showInFooter} onCheckedChange={(c) => set("showInFooter", c)} /></label>
            <Button type="submit" loading={pending} fullWidth>{t("common.actions.save")}</Button>
            {page && <Button type="button" variant="danger-outline" size="sm" fullWidth disabled={pending} onClick={remove}><Trash2 />{t("common.actions.delete")}</Button>}
          </div>
        </AdminCard>
      </div>
    </form>
  );
}
