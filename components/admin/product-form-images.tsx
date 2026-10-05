"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Star, Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button, IconButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { newKey, type PanelProps } from "./product-form-types";

/** Onglet Images : liste ordonnée {url, alt, principale}, ajout par URL ou téléversement. */
export function ProductImagesPanel({ form, update }: PanelProps) {
  const t = useT();
  const toast = useToast();
  const [url, setUrl] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const images = form.images;

  const add = (u: string) => { const next = [...images, { key: newKey(), url: u, alt: form.name, isPrimary: images.length === 0 }]; update({ images: next }); };
  const setAt = (i: number, patch: Partial<(typeof images)[number]>) => update({ images: images.map((img, j) => (j === i ? { ...img, ...patch } : img)) });
  const remove = (i: number) => { const next = images.filter((_, j) => j !== i); if (next.length && !next.some((x) => x.isPrimary)) next[0] = { ...next[0], isPrimary: true }; update({ images: next }); };
  const move = (i: number, dir: -1 | 1) => { const j = i + dir; if (j < 0 || j >= images.length) return; const next = [...images]; [next[i], next[j]] = [next[j], next[i]]; update({ images: next }); };
  const setPrimary = (i: number) => update({ images: images.map((img, j) => ({ ...img, isPrimary: j === i })) });

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.set("file", file);
        const res = await fetch("/admin/products/upload", { method: "POST", body });
        const json = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
        if (!res.ok || !json?.url) throw new Error(json?.error ?? "upload");
        add(json.url);
      }
    } catch {
      toast.error(t("admin.products.form.uploadError"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {images.length === 0 && <p className="rounded-lg border border-dashed border-border-strong p-6 text-center text-sm text-muted">{t("admin.products.form.noImages")}</p>}
      <ul className="space-y-2">
        {images.map((img, i) => (
          <li key={img.key} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-2">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-paper-2">{/^(https?:\/\/\S+|\/\S+)$/.test(img.url) && <Image src={img.url} alt="" fill sizes="64px" className="object-cover" unoptimized />}</span>
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
              <Field id={`img-url-${img.key}`} label={t("admin.products.form.imageUrl")}><Input value={img.url} onChange={(e) => setAt(i, { url: e.target.value })} className="h-9 text-sm" /></Field>
              <Field id={`img-alt-${img.key}`} label={t("admin.products.form.imageAlt")}><Input value={img.alt} onChange={(e) => setAt(i, { alt: e.target.value })} className="h-9 text-sm" /></Field>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" size="sm" variant={img.isPrimary ? "primary" : "outline"} onClick={() => setPrimary(i)} aria-pressed={img.isPrimary}><Star className="size-3.5" />{t("admin.products.form.primary")}</Button>
              <IconButton size="icon-sm" label={t("admin.cms.homepage.moveUp")} onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp /></IconButton>
              <IconButton size="icon-sm" label={t("admin.cms.homepage.moveDown")} onClick={() => move(i, 1)} disabled={i === images.length - 1}><ArrowDown /></IconButton>
              <IconButton size="icon-sm" label={t("common.actions.delete")} onClick={() => remove(i)}><Trash2 /></IconButton>
            </div>
          </li>
        ))}
      </ul>
      <div className="grid gap-3 rounded-lg border border-border bg-paper p-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Field id="img-new-url" label={t("admin.products.form.addImage")}><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("admin.common.imagePathPlaceholder")} className="h-9 text-sm" /></Field>
        <Button type="button" size="sm" variant="secondary" disabled={!url.trim()} onClick={() => { add(url.trim()); setUrl(""); }}>{t("common.actions.add")}</Button>
        <div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" multiple className="sr-only" id="img-file" onChange={(e) => upload(e.target.files)} />
          <Button type="button" size="sm" variant="outline" loading={uploading} onClick={() => fileRef.current?.click()}>{uploading ? t("admin.products.form.uploading") : t("admin.products.form.upload")}</Button>
        </div>
      </div>
    </div>
  );
}
