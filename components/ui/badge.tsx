import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva("inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold leading-tight whitespace-nowrap", {
  variants: {
    variant: {
      default: "bg-ink text-white",
      accent: "bg-accent text-white",
      promo: "bg-promo text-white",
      soft: "bg-paper-2 text-foreground",
      outline: "border border-border-strong text-foreground bg-surface",
      success: "bg-success-soft text-success",
      warning: "bg-warning-soft text-warning",
      error: "bg-error-soft text-error",
      info: "bg-info-soft text-info",
      muted: "bg-paper-2 text-muted",
    },
    size: {
      sm: "text-[10px] px-1.5 py-px",
      md: "text-[11px] px-1.5 py-0.5",
      lg: "text-xs px-2 py-1",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

/** Badge de statut : couleur dérivée d'une famille de statut. */
const statusTone: Record<string, BadgeProps["variant"]> = {
  PENDING: "warning",
  SUBMITTED: "info",
  IN_REVIEW: "info",
  CONFIRMED: "info",
  PROCESSING: "info",
  PREPARING: "info",
  QUOTED: "accent",
  SHIPPED: "accent",
  DELIVERED: "success",
  ACCEPTED: "success",
  APPROVED: "success",
  VERIFIED: "info",
  PAID: "success",
  AUTHORIZED: "info",
  ISSUED: "info",
  ACTIVE: "success",
  PUBLISHED: "success",
  CONVERTED: "success",
  CANCELLED: "muted",
  REJECTED: "error",
  SUSPENDED: "error",
  FAILED: "error",
  OVERDUE: "error",
  EXPIRED: "muted",
  REFUNDED: "muted",
  PARTIALLY_REFUNDED: "warning",
  RETURNED: "warning",
  DRAFT: "muted",
  ARCHIVED: "muted",
  NEW: "info",
  IN_PROGRESS: "warning",
  CLOSED: "muted",
};

export function StatusBadge({ status, label, className }: { status: string; label: string; className?: string }) {
  return (
    <Badge variant={statusTone[status] ?? "soft"} className={className}>
      {label}
    </Badge>
  );
}
