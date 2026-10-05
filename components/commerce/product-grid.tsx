import type { ProductCardData } from "@/types/catalog";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";

export function ProductGrid({ products, listId, className, columns = 4, priorityCount = 4, layout = "grid" }: { products: ProductCardData[]; listId?: string; className?: string; columns?: 3 | 4 | 5 | 6; priorityCount?: number; layout?: "grid" | "row" }) {
  if (layout === "row") {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < priorityCount} listId={listId} layout="row" />
        ))}
      </div>
    );
  }
  const cols = {
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
  }[columns];
  return (
    <div className={cn("grid gap-3 md:gap-4", cols, className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} listId={listId} />
      ))}
    </div>
  );
}

/** Carrousel horizontal (mobile) / grille (desktop) pour les sélections de l'accueil. */
export function ProductRail({ products, listId }: { products: ProductCardData[]; listId?: string }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {products.map((p, i) => (
        <div key={p.id} className="w-[72vw] shrink-0 snap-start sm:w-auto">
          <ProductCard product={p} priority={i < 2} listId={listId} className="h-full" />
        </div>
      ))}
    </div>
  );
}
