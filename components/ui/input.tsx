import * as React from "react";
import { cn } from "@/lib/utils";

export const inputClassName =
  "flex h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground placeholder:text-subtle transition-colors focus-visible:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:bg-paper-2 disabled:opacity-70 aria-[invalid=true]:border-error aria-[invalid=true]:focus-visible:ring-error/30";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => (
  <input ref={ref} type={type} className={cn(inputClassName, className)} {...props} />
));
Input.displayName = "Input";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(inputClassName, "h-auto min-h-24 py-2 leading-relaxed", className)} {...props} />
));
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

/** Select natif stylé — robuste, accessible, parfait sur mobile. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, placeholder, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(inputClassName, "appearance-none pe-9 cursor-pointer", className)}
      {...props}
    >
      {placeholder !== undefined && (
        <option value="" disabled={props.required}>
          {placeholder}
        </option>
      )}
      {children}
    </select>
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
));
Select.displayName = "Select";
