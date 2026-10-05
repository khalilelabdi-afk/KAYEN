import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  optionalLabel?: string;
}

export function Label({ className, required, optionalLabel, children, ...props }: LabelProps) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-foreground", className)} {...props}>
      {children}
      {required && <span aria-hidden className="ms-0.5 text-error after:content-['*']" />}
      {!required && optionalLabel && <span className="ms-1.5 text-xs font-normal text-muted">({optionalLabel})</span>}
    </label>
  );
}

export interface FieldProps {
  id: string;
  label: React.ReactNode;
  required?: boolean;
  optionalLabel?: string;
  hint?: React.ReactNode;
  error?: string | string[] | null;
  className?: string;
  children: React.ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
}

/** Champ de formulaire : label + contrôle + aide + erreur, câblés en aria. */
export function Field({ id, label, required, optionalLabel, hint, error, className, children }: FieldProps) {
  const errors = Array.isArray(error) ? error : error ? [error] : [];
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = errors.length ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("w-full", className)}>
      <Label htmlFor={id} required={required} optionalLabel={optionalLabel}>
        {label}
      </Label>
      {React.cloneElement(children, { id, "aria-describedby": describedBy, "aria-invalid": errors.length > 0 || undefined })}
      {hint && !errors.length && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {errors.length > 0 && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-error" role="alert">
          {errors[0]}
        </p>
      )}
    </div>
  );
}

export function FormError({ message, className }: { message?: string | null; className?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className={cn("rounded-md border border-error/30 bg-error-soft px-3 py-2.5 text-sm text-error", className)}>
      {message}
    </div>
  );
}

export function FormSuccess({ message, className }: { message?: string | null; className?: string }) {
  if (!message) return null;
  return (
    <div role="status" className={cn("rounded-md border border-success/30 bg-success-soft px-3 py-2.5 text-sm text-success", className)}>
      {message}
    </div>
  );
}
