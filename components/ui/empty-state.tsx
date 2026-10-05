import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/** État vide : explique et propose toujours une action. */
export function EmptyState({ icon, title, description, actions, className, size = "md" }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface text-center",
        size === "sm" && "px-4 py-8",
        size === "md" && "px-6 py-12",
        size === "lg" && "px-6 py-20",
        className,
      )}
    >
      {icon && <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-paper-2 text-muted [&_svg]:size-6">{icon}</div>}
      <h3 className={cn("font-display font-bold", size === "lg" ? "text-xl" : "text-base")}>{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
