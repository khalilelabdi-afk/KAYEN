import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({ title, subtitle, cta, className, as: Tag = "h2" }: { title: string; subtitle?: string | null; cta?: { label: string; href: string } | null; className?: string; as?: "h1" | "h2" | "h3" }) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between md:mb-8", className)}>
      <div className="max-w-2xl">
        <Tag className={Tag === "h1" ? "t-h1" : "t-h2"}>{title}</Tag>
        {subtitle && <p className="mt-2 text-sm text-muted md:text-base">{subtitle}</p>}
      </div>
      {cta && (
        <Link href={cta.href} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground hover:text-accent">
          {cta.label}
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function Section({ children, className, bordered = false }: { children: React.ReactNode; className?: string; bordered?: boolean }) {
  return <section className={cn("container-site py-10 md:py-16", bordered && "border-t border-border", className)}>{children}</section>;
}
