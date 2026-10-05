"use client";

import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { AvailabilityInfo } from "@/types/catalog";

export function AvailabilityBadge({ availability, className, showCount = false }: { availability: AvailabilityInfo; className?: string; showCount?: boolean }) {
  const t = useT();
  const map = {
    in_stock: { label: t("common.availability.inStock"), dot: "bg-success", text: "text-success" },
    low_stock: { label: showCount ? t("common.availability.onlyLeft", { count: availability.available }) : t("common.availability.lowStock"), dot: "bg-warning", text: "text-warning" },
    backorder: { label: t("common.availability.backorder"), dot: "bg-info", text: "text-info" },
    out_of_stock: { label: t("common.availability.outOfStock"), dot: "bg-error", text: "text-error" },
  }[availability.status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", map.text, className)}>
      <span className={cn("size-1.5 rounded-full", map.dot)} aria-hidden />
      {map.label}
    </span>
  );
}
