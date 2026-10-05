import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Wordmark provisoire KAYEN. Pour un logo définitif, remplacer le contenu
 * de <LogoMark/> par un SVG : tous les emplacements se mettront à jour.
 */
export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      className={cn(
        "font-display text-[1.625rem] font-extrabold leading-none tracking-[-0.06em]",
        inverted ? "text-white" : "text-ink",
        className,
      )}
      aria-hidden
    >
      KAYEN
    </span>
  );
}

export function Logo({ className, inverted = false, href = "/" }: { className?: string; inverted?: boolean; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center rounded-sm", className)} aria-label="KAYEN — Accueil">
      <LogoMark inverted={inverted} />
    </Link>
  );
}
