import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  /** Construit l'URL pour une page donnée. */
  hrefFor: (page: number) => string;
  labels: { label: string; previous: string; next: string; goTo: string };
  className?: string;
}

function range(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}

export function Pagination({ page, totalPages, hrefFor, labels, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const items = range(page, totalPages);
  const btn = "inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium transition-colors hover:bg-paper-2";
  return (
    <nav aria-label={labels.label} className={cn("flex items-center justify-center gap-1.5", className)}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={btn} aria-label={labels.previous} rel="prev">
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </Link>
      ) : (
        <span className={cn(btn, "opacity-40")} aria-disabled>
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </span>
      )}
      {items.map((item, i) =>
        item === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted">
            …
          </span>
        ) : item === page ? (
          <span key={item} className={cn(btn, "border-ink bg-ink text-white")} aria-current="page">
            {item}
          </span>
        ) : (
          <Link key={item} href={hrefFor(item)} className={cn(btn, "hidden sm:inline-flex")} aria-label={labels.goTo.replace("{page}", String(item))}>
            {item}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={btn} aria-label={labels.next} rel="next">
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Link>
      ) : (
        <span className={cn(btn, "opacity-40")} aria-disabled>
          <ChevronRight className="size-4 rtl:rotate-180" />
        </span>
      )}
    </nav>
  );
}
