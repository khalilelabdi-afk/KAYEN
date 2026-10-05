import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CheckoutSteps({ current, labels, allowed }: { current: 0 | 1 | 2 | 3; labels: string[]; allowed: number }) {
  const hrefs = ["/checkout", "/checkout/shipping", "/checkout/payment", "#"];
  return (
    <ol className="mb-8 flex items-center gap-2 overflow-x-auto text-sm scrollbar-none">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = i <= allowed && i < 3 && !active;
        const content = (
          <span className={cn("inline-flex items-center gap-2 whitespace-nowrap", active ? "font-semibold text-foreground" : done ? "text-foreground" : "text-muted")}>
            <span className={cn("flex size-6 items-center justify-center rounded-full border text-xs font-semibold", active ? "border-ink bg-ink text-white" : done ? "border-accent bg-accent text-white" : "border-border-strong")}>{done ? <Check className="size-3.5" /> : i + 1}</span>
            {label}
          </span>
        );
        return (
          <li key={label} className="flex items-center gap-2">
            {clickable ? <Link href={hrefs[i]}>{content}</Link> : content}
            {i < labels.length - 1 && <span className="mx-1 h-px w-6 bg-border sm:w-10" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
