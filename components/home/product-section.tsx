import { Section, SectionHeader } from "@/components/layout/section";
import { ProductRail } from "@/components/commerce/product-grid";
import type { ProductCardData } from "@/types/catalog";

export function ProductSection({ id, title, subtitle, cta, products, bordered = false }: { id: string; title: string; subtitle?: string | null; cta?: { label: string; href: string } | null; products: ProductCardData[]; bordered?: boolean }) {
  if (!products.length) return null;
  return (
    <Section bordered={bordered}>
      <SectionHeader title={title} subtitle={subtitle} cta={cta} />
      <ProductRail products={products} listId={id} />
    </Section>
  );
}
