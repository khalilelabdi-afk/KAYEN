import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  info: { cls: "border-info/30 bg-info-soft text-info", icon: Info },
  success: { cls: "border-success/30 bg-success-soft text-success", icon: CheckCircle2 },
  warning: { cls: "border-warning/30 bg-warning-soft text-warning", icon: AlertTriangle },
  error: { cls: "border-error/30 bg-error-soft text-error", icon: XCircle },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  actions,
}: {
  tone?: keyof typeof tones;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  const Icon = tones[tone].icon;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", tones[tone].cls, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-foreground">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("text-[13px] leading-relaxed", title && "mt-0.5")}>{children}</div>}
        {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
