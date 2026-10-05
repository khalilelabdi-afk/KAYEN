"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { Switch } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogHeading, DialogText } from "@/components/ui/dialog";
import { homeSectionSaveAction } from "@/app/actions/admin/content";

export const HOME_SECTION_TYPES = ["HERO", "SECTORS", "CATEGORIES", "BESTSELLERS", "PROMOTIONS", "NEW_ARRIVALS", "BENEFITS", "BANNER", "COLLECTION", "BRANDS", "GUIDES"] as const;
export type HomeSectionType = (typeof HOME_SECTION_TYPES)[number];

export interface HomeSectionRow {
  id: string;
  type: HomeSectionType;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  config: { limit?: number; productSkus?: string[]; categorySlugs?: string[]; variant?: string };
}

/** Types pour lesquels chaque champ de configuration a un sens. */
const USES = {
  limit: ["SECTORS", "CATEGORIES", "BESTSELLERS", "PROMOTIONS", "NEW_ARRIVALS", "BRANDS", "GUIDES"] as HomeSectionType[],
  productSkus: ["COLLECTION"] as HomeSectionType[],
  categorySlugs: ["CATEGORIES"] as HomeSectionType[],
  variant: ["BANNER"] as HomeSectionType[],
  cta: ["BESTSELLERS", "PROMOTIONS", "NEW_ARRIVALS", "COLLECTION", "BANNER"] as HomeSectionType[],
  image: ["HERO", "BANNER"] as HomeSectionType[],
};

const toForm = (s?: HomeSectionRow) => ({
  type: s?.type ?? ("COLLECTION" as HomeSectionType), title: s?.title ?? "", subtitle: s?.subtitle ?? "", ctaLabel: s?.ctaLabel ?? "", ctaHref: s?.ctaHref ?? "", image: s?.image ?? "",
  limit: s?.config.limit ? String(s.config.limit) : "", productSkus: s?.config.productSkus?.join(", ") ?? "", categorySlugs: s?.config.categorySlugs?.join(", ") ?? "", variant: s?.config.variant ?? "", isActive: s?.isActive ?? true,
});

/** Le contenu est démonté à la fermeture : l'état du formulaire repart des props à chaque ouverture. */
function HomeSectionForm({ section, onClose }: { section?: HomeSectionRow; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const [form, setForm] = React.useState(() => toForm(section));
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string[]>>({});
  const [pending, start] = React.useTransition();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const show = (key: keyof typeof USES) => USES[key].includes(form.type);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await homeSectionSaveAction({ id: section?.id, type: form.type, title: form.title, subtitle: form.subtitle, ctaLabel: form.ctaLabel, ctaHref: form.ctaHref, image: form.image, limit: form.limit.trim() ? Number(form.limit) : null, productSkus: form.productSkus, categorySlugs: form.categorySlugs, variant: form.variant, isActive: form.isActive });
      if (r.ok) { toast.success(r.message ?? ""); onClose(); } else { setError(r.error); setFe(r.fieldErrors ?? {}); }
    });
  };
  return (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader><DialogHeading>{section ? t("admin.cms.homepage.editSection") : t("admin.cms.homepage.addSection")}</DialogHeading><DialogText>{t("admin.cms.homepage.configHint")}</DialogText></DialogHeader>
          <DialogBody className="space-y-3">
            <FormError message={error} />
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field id="hs-type" label={t("admin.cms.homepage.type")} required error={fe.type}><Select value={form.type} onChange={(e) => set("type", e.target.value as HomeSectionType)} disabled={!!section}>{HOME_SECTION_TYPES.map((ty) => <option key={ty} value={ty}>{t.enum("admin.cms.homepage.sectionTypes", ty)}</option>)}</Select></Field>
              <label className="flex items-center gap-2 pb-2.5 text-sm"><Switch checked={form.isActive} onCheckedChange={(c) => set("isActive", c)} />{t("admin.cms.homepage.isActive")}</label>
            </div>
            <Field id="hs-title" label={t("admin.cms.homepage.titleField")} error={fe.title}><Input value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field id="hs-subtitle" label={t("admin.cms.homepage.subtitle")} error={fe.subtitle}><Textarea rows={2} value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} /></Field>
            {show("cta") && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="hs-cta" label={t("admin.cms.homepage.ctaLabel")} error={fe.ctaLabel}><Input value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} /></Field>
                <Field id="hs-href" label={t("admin.cms.homepage.ctaHref")} error={fe.ctaHref}><Input value={form.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} placeholder="/quote" /></Field>
              </div>
            )}
            {show("image") && <Field id="hs-image" label={t("admin.cms.homepage.image")} error={fe.image}><Input value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" /></Field>}
            <div className="grid gap-3 sm:grid-cols-2">
              {show("limit") && <Field id="hs-limit" label={t("admin.cms.homepage.limit")} error={fe.limit}><Input type="number" min={1} max={48} value={form.limit} onChange={(e) => set("limit", e.target.value)} /></Field>}
              {show("variant") && <Field id="hs-variant" label={t("admin.cms.homepage.variant")} hint={t("admin.cms.homepage.variantHint")} error={fe.variant}><Input value={form.variant} onChange={(e) => set("variant", e.target.value)} /></Field>}
            </div>
            {show("productSkus") && <Field id="hs-skus" label={t("admin.cms.homepage.productIds")} error={fe.productSkus}><Textarea rows={2} value={form.productSkus} onChange={(e) => set("productSkus", e.target.value)} className="font-mono text-xs uppercase" /></Field>}
            {show("categorySlugs") && <Field id="hs-cats" label={t("admin.cms.homepage.categorySlugs")} error={fe.categorySlugs}><Textarea rows={2} value={form.categorySlugs} onChange={(e) => set("categorySlugs", e.target.value)} className="font-mono text-xs" /></Field>}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t("common.actions.cancel")}</Button>
            <Button type="submit" loading={pending}>{t("common.actions.save")}</Button>
          </DialogFooter>
        </form>
  );
}

export function HomeSectionDialog({ open, onOpenChange, section }: { open: boolean; onOpenChange: (open: boolean) => void; section?: HomeSectionRow }) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" closeLabel={t("common.actions.close")}><HomeSectionForm section={section} onClose={() => onOpenChange(false)} /></DialogContent>
    </Dialog>
  );
}

export function HomeSectionAddButton() {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus />{t("admin.cms.homepage.addSection")}</Button>
      <HomeSectionDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
