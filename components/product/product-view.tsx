"use client";

import * as React from "react";
import { ProductGallery } from "./gallery";
import { BuyBox, type BuyBoxProps } from "./buy-box";
import type { ProductDetail } from "@/services/catalog/product";

/** Coordonne galerie et bloc d'achat (image de la variante sélectionnée). */
export function ProductView({ product, buyBox }: { product: ProductDetail; buyBox: Omit<BuyBoxProps, "onVariantChange"> }) {
  const [variantId, setVariantId] = React.useState<string | null>(null);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
      <div className="lg:sticky lg:top-32 lg:self-start">
        <ProductGallery images={product.images} name={product.name} videoUrl={product.videoUrl} activeVariantId={variantId} />
      </div>
      <BuyBox {...buyBox} onVariantChange={setVariantId} />
    </div>
  );
}
