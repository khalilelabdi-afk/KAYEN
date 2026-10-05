"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Copy, ExternalLink, Eye, EyeOff, Pencil } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button, IconButton } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { productDuplicateAction, productStatusAction } from "@/app/actions/admin/catalog";

/** Actions produit : modifier, dupliquer, publier / dépublier, archiver, voir sur le site. */
export function ProductActions({ id, status, slug, variant = "row" }: { id: string; status: string; slug: string; variant?: "row" | "header" }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const setStatus = (s: "DRAFT" | "ACTIVE" | "ARCHIVED") => {
    if (s === "ARCHIVED" && !window.confirm(t("admin.products.form.deleteConfirm"))) return;
    start(async () => { const r = await productStatusAction({ id, status: s }); if (r.ok) { toast.success(r.message ?? ""); router.refresh(); } else toast.error(r.error); });
  };
  const duplicate = () => start(async () => { const r = await productDuplicateAction({ id }); if (r.ok && r.data) { toast.success(r.message ?? ""); router.push(`/admin/products/${r.data.id}`); } else if (!r.ok) toast.error(r.error); });

  if (variant === "header") {
    return (
      <div className="flex flex-wrap gap-2">
        {status === "ACTIVE" && <Button asChild size="sm" variant="outline"><a href={`/p/${slug}`} target="_blank" rel="noopener"><ExternalLink />{t("admin.products.form.preview")}</a></Button>}
        <Button size="sm" variant="outline" disabled={pending} onClick={duplicate}><Copy />{t("admin.products.form.duplicate")}</Button>
        {status !== "ACTIVE" && <Button size="sm" variant="accent" disabled={pending} onClick={() => setStatus("ACTIVE")}><Eye />{t("admin.products.form.publish")}</Button>}
        {status === "ACTIVE" && <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("DRAFT")}><EyeOff />{t("admin.products.form.unpublish")}</Button>}
        {status !== "ARCHIVED" && <Button size="sm" variant="danger-outline" disabled={pending} onClick={() => setStatus("ARCHIVED")}><Archive />{t("admin.products.form.archive")}</Button>}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-end gap-0.5">
      <IconButton size="icon-sm" label={t("common.actions.edit")} asChild><Link href={`/admin/products/${id}`}><Pencil /></Link></IconButton>
      <IconButton size="icon-sm" label={t("admin.products.form.duplicate")} disabled={pending} onClick={duplicate}><Copy /></IconButton>
      {status !== "ACTIVE" ? (
        <IconButton size="icon-sm" label={t("admin.products.form.publish")} disabled={pending} onClick={() => setStatus("ACTIVE")}><Eye /></IconButton>
      ) : (
        <IconButton size="icon-sm" label={t("admin.products.form.archive")} disabled={pending} onClick={() => setStatus("ARCHIVED")}><Archive /></IconButton>
      )}
      {status === "ACTIVE" && <IconButton size="icon-sm" label={t("admin.products.form.preview")} asChild><a href={`/p/${slug}`} target="_blank" rel="noopener"><ExternalLink /></a></IconButton>}
    </div>
  );
}
