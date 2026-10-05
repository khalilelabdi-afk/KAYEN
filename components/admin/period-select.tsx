"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";

export function PeriodSelect({ value, options, label }: { value: string; options: { value: string; label: string }[]; label: string }) {
  const router = useRouter();
  return (
    <Select value={value} onChange={(e) => router.push(`/admin?period=${e.target.value}`)} aria-label={label} className="h-9 w-44 text-sm">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </Select>
  );
}
