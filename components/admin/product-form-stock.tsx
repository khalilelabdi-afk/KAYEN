"use client";

import { useT } from "@/i18n/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/checkbox";
import type { PanelProps, VariantState } from "./product-form-types";

/** Onglet Stock : quantité, seuil d'alerte et précommande par variante. */
export function ProductStockPanel({ form, update }: PanelProps) {
  const t = useT();
  const setStock = (i: number, patch: Partial<VariantState["stock"]>) => update({ variants: form.variants.map((v, j) => (j === i ? { ...v, stock: { ...v.stock, ...patch } } : v)) });
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t("admin.products.form.stockHint")}</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-paper-2/70 text-xs text-muted">
            <tr><th className="px-3 py-2 text-start font-semibold">{t("admin.products.form.variant")}</th><th className="px-3 py-2 text-start font-semibold">{t("admin.products.form.quantity")}</th><th className="px-3 py-2 text-start font-semibold">{t("admin.products.form.lowStockThreshold")}</th><th className="px-3 py-2 text-start font-semibold">{t("admin.products.form.allowBackorder")}</th></tr>
          </thead>
          <tbody>
            {form.variants.map((v, i) => (
              <tr key={v.key} className="border-t border-border">
                <td className="px-3 py-2"><span className="font-mono text-xs">{v.sku || "—"}</span>{v.name && <span className="block text-xs text-muted">{v.name}</span>}</td>
                <td className="px-3 py-2"><Input type="number" min={0} aria-label={t("admin.products.form.quantity")} value={v.stock.quantity} onChange={(e) => setStock(i, { quantity: e.target.value })} className="h-9 w-28 text-sm tnum" /></td>
                <td className="px-3 py-2"><Input type="number" min={0} aria-label={t("admin.products.form.lowStockThreshold")} value={v.stock.lowStockThreshold} onChange={(e) => setStock(i, { lowStockThreshold: e.target.value })} className="h-9 w-28 text-sm tnum" /></td>
                <td className="px-3 py-2"><Switch checked={v.stock.allowBackorder} onCheckedChange={(c) => setStock(i, { allowBackorder: c })} aria-label={t("admin.products.form.allowBackorder")} /></td>
              </tr>
            ))}
            {!form.variants.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted">{t("admin.products.form.noVariants")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
