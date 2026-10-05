"use client";

import * as React from "react";
import { Trash2, Download } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { clearCartAction } from "@/app/actions/cart";
import type { CartLineView } from "@/services/cart";

export function CartTools({ lines }: { lines: CartLineView[] }) {
  const t = useT();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  const exportCsv = () => {
    const rows = [["SKU", "Produit", "Quantité", "Prix unitaire HT", "Total HT"], ...lines.map((l) => [l.sku, l.name, String(l.quantity), (l.unit.unitPrice / 100).toFixed(2), (l.lineSubtotal / 100).toFixed(2)])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "panier-kayen.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" size="sm" onClick={exportCsv}><Download />{t("cart.summary.exportCart")}</Button>
      <Button variant="ghost" size="sm" loading={pending} onClick={() => { if (window.confirm(t("cart.confirmClear"))) start(async () => { await clearCartAction(); toast.info(t("common.toasts.cartUpdated")); }); }}><Trash2 />{t("cart.summary.clear")}</Button>
    </div>
  );
}
