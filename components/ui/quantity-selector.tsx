"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeQuantity, stepQuantity } from "@/lib/pricing/quantity";

export interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  moq?: number;
  step?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  labels: { decrease: string; increase: string; quantity: string };
  className?: string;
  name?: string;
  id?: string;
}

/**
 * QuantitySelector — stepper optimisé pour le pouce. Respecte MOQ et pas de commande.
 * La normalisation se fait au blur / sur les boutons pour ne pas bloquer la saisie.
 */
export function QuantitySelector({ value, onChange, moq = 1, step = 1, max, size = "md", disabled, labels, className, name, id }: QuantitySelectorProps) {
  const [draft, setDraft] = React.useState(String(value));
  const [lastValue, setLastValue] = React.useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(String(value));
  }

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    let next = normalizeQuantity(Number.isFinite(parsed) ? parsed : moq, moq, step);
    if (max !== undefined && next > max) next = normalizeQuantity(max, moq, step) > max ? moq : Math.max(moq, max - ((max - moq) % step));
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const dec = () => onChange(stepQuantity(value, -1, moq, step));
  const inc = () => {
    const next = stepQuantity(value, 1, moq, step);
    if (max !== undefined && next > max) return;
    onChange(next);
  };

  const h = size === "sm" ? "h-9" : size === "lg" ? "h-12" : "h-10";
  const btn = cn(
    "flex shrink-0 items-center justify-center text-foreground transition-colors hover:bg-paper-2 disabled:opacity-40 disabled:hover:bg-transparent",
    size === "sm" ? "w-9" : size === "lg" ? "w-12" : "w-10",
  );

  return (
    <div className={cn("inline-flex items-stretch overflow-hidden rounded-md border border-border-strong bg-surface", h, className)}>
      <button type="button" onClick={dec} disabled={disabled || value <= moq} aria-label={labels.decrease} className={btn}>
        <Minus className="size-4" />
      </button>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={moq}
        step={step}
        max={max}
        value={draft}
        disabled={disabled}
        aria-label={labels.quantity}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit((e.target as HTMLInputElement).value);
          }
        }}
        className={cn("w-12 min-w-0 border-x border-border-strong bg-transparent text-center text-sm font-semibold tnum focus:outline-none focus-visible:bg-paper-2", size === "lg" && "w-16 text-base")}
      />
      <button type="button" onClick={inc} disabled={disabled || (max !== undefined && value + step > max)} aria-label={labels.increase} className={btn}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}
