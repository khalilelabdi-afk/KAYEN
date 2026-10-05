import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Image produit responsive avec dimensions fixées (zéro layout shift).
 * Les SVG provisoires sont servis tels quels ; les photos réelles passent par l'optimiseur.
 */
export function ProductImage({
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
  className,
  fill = true,
  width,
  height,
}: {
  src: string | null | undefined;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  if (!src) {
    return <div className={cn("flex size-full items-center justify-center bg-paper-2 text-subtle", className)} aria-hidden />;
  }
  if (fill) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={cn("object-cover", className)} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} />;
  }
  return <Image src={src} alt={alt} width={width ?? 600} height={height ?? 600} sizes={sizes} className={cn("object-cover", className)} loading={priority ? "eager" : "lazy"} />;
}
