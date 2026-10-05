"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { Switch } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogHeading } from "@/components/ui/dialog";
import { AdminCard } from "@/components/admin/ui";
import { faqSaveAction, faqDeleteAction } from "@/app/actions/admin/content";

export interface FaqRow { id: string; category: string; question: string; answer: string; sortOrder: number; isActive: boolean }
type FaqCategory = "commande" | "compte" | "prix" | "livraison" | "devis" | "paiement" | "facturation" | "retours" | "disponibilite";

const toForm = (f?: Partial<FaqRow>) => ({ category: (f?.category ?? "commande") as FaqCategory, question: f?.question ?? "", answer: f?.answer ?? "", sortOrder: String(f?.sortOrder ?? 0), isActive: f?.isActive ?? true });

/** Le contenu est démonté à la fermeture : l'état repart des props à chaque ouverture. */
function FaqForm({ faq, categories, onClose }: { faq?: Partial<FaqRow>; categories: string[]; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const [form, setForm] = React.useState(() => toForm(faq));
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string[]>>({});
  const [pending, start] = React.useTransition();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const submit = (e: React.FormEvent) => { e.preventDefault(); start(async () => { const r = await faqSaveAction({ id: faq?.id, ...form, sortOrder: Number(form.sortOrder) }); if (r.ok) { toast.success(r.message ?? ""); onClose(); } else { setError(r.error); setFe(r.fieldErrors ?? {}); } }); };
  return (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader><DialogHeading>{faq?.id ? t("admin.cms.faq.edit") : t("admin.cms.faq.create")}</DialogHeading></DialogHeader>
          <DialogBody className="space-y-3">
            <FormError message={error} />
            <div className="grid gap-3 sm:grid-cols-[1fr_100px_auto] sm:items-end">
              <Field id="faq-cat" label={t("admin.cms.faq.form.category")} required error={fe.category}><Select value={form.category} onChange={(e) => set("category", e.target.value as FaqCategory)}>{categories.map((c) => <option key={c} value={c}>{t.enum("cms.faq.categories", c)}</option>)}</Select></Field>
              <Field id="faq-order" label={t("admin.cms.faq.form.sortOrder")} error={fe.sortOrder}><Input type="number" min={0} value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></Field>
              <label className="flex items-center gap-2 pb-2.5 text-sm"><Switch checked={form.isActive} onCheckedChange={(c) => set("isActive", c)} />{t("admin.cms.faq.form.isActive")}</label>
            </div>
            <Field id="faq-q" label={t("admin.cms.faq.form.question")} required error={fe.question}><Input value={form.question} onChange={(e) => set("question", e.target.value)} maxLength={300} /></Field>
            <Field id="faq-a" label={t("admin.cms.faq.form.answer")} required error={fe.answer}><Textarea rows={6} value={form.answer} onChange={(e) => set("answer", e.target.value)} maxLength={4000} /></Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
            <Button type="submit" loading={pending}>{t("common.actions.save")}</Button>
          </DialogFooter>
        </form>
  );
}

function FaqDialog({ open, onOpenChange, faq, categories }: { open: boolean; onOpenChange: (open: boolean) => void; faq?: Partial<FaqRow>; categories: string[] }) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" closeLabel={t("common.actions.close")}><FaqForm faq={faq} categories={categories} onClose={() => onOpenChange(false)} /></DialogContent>
    </Dialog>
  );
}

export function FaqGroups({ faqs, categories }: { faqs: FaqRow[]; categories: string[] }) {
  const t = useT();
  const toast = useToast();
  const [editing, setEditing] = React.useState<Partial<FaqRow> | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [, start] = React.useTransition();
  const remove = (f: FaqRow) => { if (!window.confirm(t("admin.cms.faq.deleteConfirm"))) return; setBusy(f.id); start(async () => { const r = await faqDeleteAction({ id: f.id }); if (r.ok) toast.success(r.message ?? ""); else toast.error(r.error); setBusy(null); }); };
  return (
    <>
      <div className="mb-4 flex justify-end"><Button size="sm" onClick={() => setEditing({})}><Plus />{t("admin.cms.faq.create")}</Button></div>
      <div className="space-y-6">
        {categories.map((cat) => {
          const items = faqs.filter((f) => f.category === cat).sort((a, b) => a.sortOrder - b.sortOrder);
          return (
            <AdminCard key={cat} title={`${t.enum("cms.faq.categories", cat)} · ${t("admin.cms.faq.count", { count: items.length })}`} className="[&>div]:p-0" actions={<Button size="sm" variant="ghost" onClick={() => setEditing({ category: cat, sortOrder: items.length })}><Plus />{t("admin.cms.faq.create")}</Button>}>
              {items.length ? (
                <ul className="divide-y divide-border">
                  {items.map((f) => (
                    <li key={f.id} className={cn("flex items-start gap-3 px-4 py-3", !f.isActive && "opacity-60")}>
                      <span className="w-6 shrink-0 pt-0.5 text-xs text-muted tnum">{f.sortOrder}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{f.question}{!f.isActive && <Badge variant="muted" className="ms-2">{t("admin.cms.faq.inactive")}</Badge>}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{f.answer}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <IconButton label={t("common.actions.edit")} size="icon-sm" onClick={() => setEditing(f)}><Pencil /></IconButton>
                        <IconButton label={t("common.actions.delete")} size="icon-sm" className="text-error hover:bg-error-soft" disabled={busy === f.id} onClick={() => remove(f)}><Trash2 /></IconButton>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="px-4 py-3 text-sm text-muted">{t("admin.cms.faq.empty")}</p>}
            </AdminCard>
          );
        })}
      </div>
      <FaqDialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null); }} faq={editing ?? undefined} categories={categories} />
    </>
  );
}
