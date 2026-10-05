"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button, IconButton } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { productSearchAction } from "@/app/actions/admin/catalog";
import { DOCUMENT_TYPES, RELATION_TYPES, newKey, type PanelProps } from "./product-form-types";

/** Onglet Attributs. */
export function ProductAttributesPanel({ form, update, refs }: PanelProps) {
  const t = useT();
  const rows = form.attributes;
  const set = (i: number, patch: Partial<(typeof rows)[number]>) => update({ attributes: rows.map((a, j) => (j === i ? { ...a, ...patch } : a)) });
  const used = new Set(rows.map((a) => a.attributeId));
  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-sm text-muted">{t("admin.products.form.noAttributes")}</p>}
      {rows.map((a, i) => {
        const def = refs.attributes.find((x) => x.id === a.attributeId);
        return (
          <div key={a.key} className="grid gap-2 sm:grid-cols-[260px_1fr_auto] sm:items-end">
            <Field id={`attr-${a.key}`} label={t("admin.products.form.attribute")}>
              <Select value={a.attributeId} onChange={(e) => set(i, { attributeId: e.target.value })} className="h-9 text-sm"><option value="">—</option>{refs.attributes.filter((x) => x.id === a.attributeId || !used.has(x.id)).map((x) => <option key={x.id} value={x.id}>{x.unit ? `${x.name} (${x.unit})` : x.name}</option>)}</Select>
            </Field>
            <Field id={`attr-val-${a.key}`} label={t("admin.products.form.value")}>
              {def?.type === "BOOLEAN" ? (
                <Select value={a.value} onChange={(e) => set(i, { value: e.target.value })} className="h-9 text-sm"><option value="">—</option><option value="Oui">{t("common.labels.yes")}</option><option value="Non">{t("common.labels.no")}</option></Select>
              ) : (
                <Input value={a.value} inputMode={def?.type === "NUMBER" ? "decimal" : undefined} onChange={(e) => set(i, { value: e.target.value })} className="h-9 text-sm" />
              )}
            </Field>
            <IconButton size="icon-sm" label={t("common.actions.delete")} className="mb-0.5" onClick={() => update({ attributes: rows.filter((_, j) => j !== i) })}><Trash2 /></IconButton>
          </div>
        );
      })}
      <Button type="button" size="sm" variant="outline" disabled={rows.length >= refs.attributes.length} onClick={() => update({ attributes: [...rows, { key: newKey(), attributeId: "", value: "" }] })}><Plus />{t("admin.products.form.addAttribute")}</Button>
    </div>
  );
}

/** Onglet Documents. */
export function ProductDocumentsPanel({ form, update }: PanelProps) {
  const t = useT();
  const rows = form.documents;
  const set = (i: number, patch: Partial<(typeof rows)[number]>) => update({ documents: rows.map((d, j) => (j === i ? { ...d, ...patch } : d)) });
  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-sm text-muted">{t("admin.products.form.noDocuments")}</p>}
      {rows.map((d, i) => (
        <div key={d.key} className="grid gap-2 sm:grid-cols-[180px_1fr_1fr_auto] sm:items-end">
          <Field id={`doc-type-${d.key}`} label={t("admin.products.form.documentType")}><Select value={d.type} onChange={(e) => set(i, { type: e.target.value as (typeof DOCUMENT_TYPES)[number] })} className="h-9 text-sm">{DOCUMENT_TYPES.map((ty) => <option key={ty} value={ty}>{t.enum("admin.products.form.documentTypes", ty)}</option>)}</Select></Field>
          <Field id={`doc-name-${d.key}`} label={t("admin.products.form.documentName")}><Input value={d.name} onChange={(e) => set(i, { name: e.target.value })} className="h-9 text-sm" /></Field>
          <Field id={`doc-url-${d.key}`} label={t("admin.products.form.documentUrl")}><Input value={d.url} onChange={(e) => set(i, { url: e.target.value })} placeholder={t("admin.common.documentPathPlaceholder")} className="h-9 text-sm" /></Field>
          <IconButton size="icon-sm" label={t("common.actions.delete")} className="mb-0.5" onClick={() => update({ documents: rows.filter((_, j) => j !== i) })}><Trash2 /></IconButton>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => update({ documents: [...rows, { key: newKey(), type: "OTHER", name: "", url: "" }] })}><Plus />{t("admin.products.form.addDocument")}</Button>
    </div>
  );
}

/** Onglet FAQ produit. */
export function ProductFaqsPanel({ form, update }: PanelProps) {
  const t = useT();
  const rows = form.faqs;
  const set = (i: number, patch: Partial<(typeof rows)[number]>) => update({ faqs: rows.map((f, j) => (j === i ? { ...f, ...patch } : f)) });
  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-sm text-muted">{t("admin.products.form.noFaqs")}</p>}
      {rows.map((f, i) => (
        <div key={f.key} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Field id={`faq-q-${f.key}`} label={t("admin.products.form.faqQuestion")}><Input value={f.question} onChange={(e) => set(i, { question: e.target.value })} className="h-9 text-sm" /></Field>
            <Field id={`faq-a-${f.key}`} label={t("admin.products.form.faqAnswer")}><Textarea rows={2} value={f.answer} onChange={(e) => set(i, { answer: e.target.value })} className="text-sm" /></Field>
          </div>
          <IconButton size="icon-sm" label={t("common.actions.delete")} onClick={() => update({ faqs: rows.filter((_, j) => j !== i) })}><Trash2 /></IconButton>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => update({ faqs: [...rows, { key: newKey(), question: "", answer: "" }] })}><Plus />{t("admin.products.form.addFaq")}</Button>
    </div>
  );
}

/** Onglet Produits associés : recherche par SKU / nom via action serveur. */
export function ProductRelatedPanel({ form, update }: PanelProps) {
  const t = useT();
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<(typeof RELATION_TYPES)[number]>("SIMILAR");
  const [results, setResults] = React.useState<{ id: string; sku: string; name: string; status: string }[]>([]);
  const [pending, start] = React.useTransition();
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const rows = form.related;
  const search = (value: string) => {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(() => start(async () => { const r = await productSearchAction({ q: value, excludeId: form.id }); setResults(r.ok ? (r.data ?? []) : []); }), 250);
  };
  const add = (p: { id: string; sku: string; name: string }) => {
    if (rows.some((r) => r.targetId === p.id && r.type === type)) return;
    update({ related: [...rows, { targetId: p.id, sku: p.sku, name: p.name, type }] });
    setQ("");
    setResults([]);
  };
  return (
    <div className="space-y-4">
      {rows.length === 0 && <p className="text-sm text-muted">{t("admin.products.form.noRelated")}</p>}
      {rows.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {rows.map((r, i) => (
            <li key={`${r.targetId}-${r.type}`} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1"><span className="font-medium">{r.name}</span><span className="ms-2 font-mono text-xs text-muted">{r.sku}</span></span>
              <Select value={r.type} aria-label={t("admin.products.form.relationType")} onChange={(e) => update({ related: rows.map((x, j) => (j === i ? { ...x, type: e.target.value as (typeof RELATION_TYPES)[number] } : x)) })} className="h-8 w-56 text-xs">{RELATION_TYPES.map((ty) => <option key={ty} value={ty}>{t.enum("admin.products.form.relationTypes", ty)}</option>)}</Select>
              <IconButton size="icon-sm" label={t("common.actions.remove")} onClick={() => update({ related: rows.filter((_, j) => j !== i) })}><Trash2 /></IconButton>
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-lg border border-border bg-paper p-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_240px] sm:items-end">
          <Field id="rel-search" label={t("admin.products.form.addRelated")}><Input value={q} onChange={(e) => search(e.target.value)} placeholder={t("admin.products.form.searchRelated")} className="h-9 text-sm" /></Field>
          <Field id="rel-type" label={t("admin.products.form.relationType")}><Select value={type} onChange={(e) => setType(e.target.value as (typeof RELATION_TYPES)[number])} className="h-9 text-sm">{RELATION_TYPES.map((ty) => <option key={ty} value={ty}>{t.enum("admin.products.form.relationTypes", ty)}</option>)}</Select></Field>
        </div>
        {(results.length > 0 || pending) && (
          <ul className="mt-2 max-h-56 divide-y divide-border overflow-y-auto rounded-md border border-border bg-surface text-sm" aria-busy={pending}>
            {results.map((p) => <li key={p.id}><button type="button" onClick={() => add(p)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-start hover:bg-paper"><span>{p.name}</span><span className="font-mono text-xs text-muted">{p.sku}</span></button></li>)}
            {pending && !results.length && <li className="px-3 py-2 text-muted">{t("common.labels.loading")}</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
