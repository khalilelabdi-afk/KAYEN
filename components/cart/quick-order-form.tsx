"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2, Upload, ShoppingCart } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { quickOrderAction, type QuickOrderLineResult } from "@/app/actions/quick-order";

interface Line { sku: string; quantity: string }

function parseText(text: string): Line[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [sku, qty] = l.split(/[;,\t]/).map((s) => s?.trim());
      return { sku: sku ?? "", quantity: qty && /^\d+$/.test(qty) ? qty : "1" };
    })
    .filter((l) => l.sku && !/^sku$/i.test(l.sku));
}

export function QuickOrderForm() {
  const t = useT();
  const toast = useToast();
  const [lines, setLines] = React.useState<Line[]>(Array.from({ length: 5 }, () => ({ sku: "", quantity: "1" })));
  const [paste, setPaste] = React.useState("");
  const [results, setResults] = React.useState<QuickOrderLineResult[] | null>(null);
  const [pending, start] = React.useTransition();

  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const importText = (text: string) => {
    const parsed = parseText(text);
    if (parsed.length) setLines((ls) => [...ls.filter((l) => l.sku.trim()), ...parsed]);
  };
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    importText(await file.text());
  };
  const submit = () => {
    const valid = lines.filter((l) => l.sku.trim()).map((l) => ({ sku: l.sku.trim(), quantity: Number.parseInt(l.quantity, 10) || 1 }));
    if (!valid.length) {
      toast.error(t("account.quickOrder.empty"));
      return;
    }
    start(async () => {
      const res = await quickOrderAction({ lines: valid });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setResults(res.data?.results ?? []);
      if (res.data?.added) toast.success(res.message ?? "", { action: { label: t("cart.drawer.viewCart"), href: "/cart" } });
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-4 md:p-6">
        <div className="grid grid-cols-[1fr_110px_auto] gap-2 text-xs font-semibold text-muted">
          <span>{t("account.quickOrder.sku")}</span><span>{t("account.quickOrder.quantity")}</span><span />
        </div>
        <div className="mt-2 space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-[1fr_110px_auto] gap-2">
              <Input value={line.sku} onChange={(e) => setLine(i, { sku: e.target.value.toUpperCase() })} placeholder="RES-GOB-25CL" aria-label={t("account.quickOrder.sku")} className="uppercase" />
              <Input type="number" min={1} value={line.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} aria-label={t("account.quickOrder.quantity")} />
              <Button type="button" variant="ghost" size="icon" aria-label={t("common.actions.remove")} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}><Trash2 /></Button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, { sku: "", quantity: "1" }])}><Plus />{t("account.quickOrder.addLine")}</Button>
          <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-[13px] font-medium hover:bg-paper-2">
            <Upload className="size-4" />{t("account.quickOrder.import")}
            <input type="file" accept=".csv,.txt" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">{t("account.quickOrder.importDesc")}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 md:p-6">
        <label htmlFor="qo-paste" className="mb-1.5 block text-sm font-medium">{t("account.quickOrder.pasteLabel")}</label>
        <Textarea id="qo-paste" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={t("account.quickOrder.importPlaceholder")} rows={4} className="font-mono text-xs" />
        <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => { importText(paste); setPaste(""); }}>{t("account.quickOrder.parse")}</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={submit} loading={pending}><ShoppingCart />{t("account.quickOrder.addToCart")}</Button>
        <Link href="/cart" className="text-sm text-muted underline underline-offset-2 hover:text-foreground">{t("cart.drawer.viewCart")}</Link>
      </div>

      {results && (
        <div className="rounded-lg border border-border bg-surface">
          <p className="border-b border-border px-4 py-3 text-sm font-semibold">{t("account.quickOrder.result")}</p>
          <ul className="divide-y divide-border text-sm">
            {results.map((r, i) => (
              <li key={i} className={cn("flex items-center justify-between gap-3 px-4 py-2.5", r.status === "not_found" || r.status === "error" ? "text-error" : r.status === "adjusted" ? "text-warning" : "")}>
                <span className="min-w-0 truncate"><span className="font-mono text-xs">{r.sku}</span>{r.name && <span className="ms-2">{r.name}</span>}</span>
                <span className="shrink-0 text-xs">{r.message ?? (r.quantity !== undefined ? `× ${r.quantity}` : "")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
