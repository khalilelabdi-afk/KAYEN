"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, CornerDownRight } from "lucide-react";
import { useT } from "@/i18n/client";
import { IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { categoryDeleteAction } from "@/app/actions/admin/catalog";

export interface CategoryTreeRow { id: string; name: string; slug: string; path: string; level: number; sortOrder: number; isVisible: boolean; showInNav: boolean; productCount: number; childCount: number }

/** Arborescence indentée des catégories avec comptages et actions. */
export function CategoryTree({ rows }: { rows: CategoryTreeRow[] }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const remove = (row: CategoryTreeRow) => {
    if (!window.confirm(t("admin.categories.form.deleteConfirm"))) return;
    start(async () => { const r = await categoryDeleteAction({ id: row.id }); if (r.ok) { toast.success(r.message ?? ""); router.refresh(); } else toast.error(r.error); });
  };
  return (
    <Table>
      <THead><TR><TH>{t("admin.categories.columns.name")}</TH><TH>{t("admin.categories.columns.slug")}</TH><TH className="text-end">{t("admin.categories.columns.products")}</TH><TH className="text-end">{t("admin.categories.columns.order")}</TH><TH>{t("admin.categories.columns.visible")}</TH><TH className="text-end">{t("common.labels.actions")}</TH></TR></THead>
      <TBody>
        {rows.map((row) => (
          <TR key={row.id}>
            <TD>
              <span className="flex items-center gap-2" style={{ paddingInlineStart: `${row.level * 20}px` }}>
                {row.level > 0 && <CornerDownRight className="size-3.5 shrink-0 text-subtle" aria-hidden />}
                <Link href={`/admin/categories/${row.id}`} className="font-medium hover:underline">{row.name}</Link>
                {row.showInNav && <Badge variant="outline" size="sm">Nav</Badge>}
              </span>
            </TD>
            <TD className="font-mono text-xs text-muted">{row.path}</TD>
            <TD className="text-end tnum">{row.productCount}</TD>
            <TD className="text-end tnum">{row.sortOrder}</TD>
            <TD>{row.isVisible ? <Badge variant="success" size="sm">{t("common.labels.yes")}</Badge> : <Badge variant="muted" size="sm">{t("common.labels.no")}</Badge>}</TD>
            <TD>
              <span className="flex justify-end gap-0.5">
                <IconButton size="icon-sm" label={t("common.actions.edit")} asChild><Link href={`/admin/categories/${row.id}`}><Pencil /></Link></IconButton>
                <IconButton size="icon-sm" label={t("common.actions.delete")} disabled={pending || row.productCount > 0 || row.childCount > 0} onClick={() => remove(row)}><Trash2 /></IconButton>
              </span>
            </TD>
          </TR>
        ))}
        {!rows.length && <TR><TD colSpan={6} className="py-8 text-center text-muted">{t("admin.table.noResults")}</TD></TR>}
      </TBody>
    </Table>
  );
}
