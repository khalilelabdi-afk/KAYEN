"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { inputClassName } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { importUploadAction, importConfirmAction, type ImportUploadState } from "@/app/actions/admin/imports";

/** Formulaire multipart : fichier CSV → action serveur (validation) → redirection vers le rapport. */
export function ImportUploadForm() {
  const t = useT();
  const [state, action, pending] = React.useActionState<ImportUploadState, FormData>(importUploadAction, undefined);
  return (
    <form action={action} className="space-y-3" encType="multipart/form-data">
      <FormError message={state?.error} />
      <Field id="import-file" label={t("admin.products.import.file")} required hint={t("admin.products.import.columnsHint")}>
        <input type="file" name="file" accept=".csv,text/csv,text/plain" required className={cn(inputClassName, "py-2 file:me-3 file:rounded-md file:border-0 file:bg-paper-2 file:px-3 file:py-1 file:text-sm file:font-medium")} />
      </Field>
      <Button type="submit" loading={pending}><Upload />{t("admin.products.import.validate")}</Button>
    </form>
  );
}

/** Confirmation de l'import (seconde action) après lecture du rapport. */
export function ImportConfirmButton({ id, count }: { id: string; count: number }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="accent" loading={pending} onClick={() => { if (!window.confirm(t("admin.products.import.confirmHint"))) return; start(async () => { const r = await importConfirmAction({ id }); if (r.ok) { toast.success(r.message ?? ""); router.refresh(); } else toast.error(r.error); }); }}>
        <CheckCircle2 />{pending ? t("admin.products.import.importing") : t("admin.products.import.confirm", { count })}
      </Button>
      <span className="text-xs text-muted">{t("admin.products.import.confirmHint")}</span>
    </div>
  );
}
