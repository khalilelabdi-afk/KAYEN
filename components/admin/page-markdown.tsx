"use client";

import * as React from "react";
import { renderMarkdown } from "@/lib/markdown";
import { Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

/** Éditeur Markdown avec aperçu en direct (colonne de droite sur grand écran). */
export function MarkdownEditor({ id, label, previewLabel, value, onChange, error, rows = 22 }: { id: string; label: string; previewLabel: string; value: string; onChange: (value: string) => void; error?: string[]; rows?: number }) {
  const html = React.useMemo(() => renderMarkdown(value), [value]);
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Field id={id} label={label} error={error}><Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs leading-relaxed" spellCheck={false} /></Field>
      <div className="min-w-0">
        <p className="mb-1.5 text-sm font-medium">{previewLabel}</p>
        <div className="prose-kayen max-h-[36rem] overflow-y-auto rounded-md border border-border bg-paper px-4 py-3 text-sm" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
