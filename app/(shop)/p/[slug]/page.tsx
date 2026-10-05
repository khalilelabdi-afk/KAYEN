import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { PackageX } from "lucide-react";
import { getT } from "@/i18n/server";
import { getPricingContext } from "@/lib/auth/dal";
import { getProductDetail, getRelatedProducts, incrementViewCount } from "@/services/catalog/product";
import { getActivePromotions } from "@/services/pricing";
import { getSettings } from "@/services/settings";
import { serializeContext, serializePromotions } from "@/lib/pricing/serialize";
import { markdownToText } from "@/lib/markdown";
import { Section, SectionHeader } from "@/components/layout/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProductView } from "@/components/product/product-view";
import { ProductInfoTabs } from "@/components/product/info-tabs";
import { RelatedSelection } from "@/components/product/related-selection";
import { ProductRail } from "@/components/commerce/product-grid";
import { JsonLd, breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import { siteConfig } from "@/lib/config/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getPricingContext();
  const { product } = await getProductDetail(slug, ctx);
  if (!product) return {};
  const description = product.seoDescription ?? product.shortDescription ?? markdownToText(product.description, 155);
  return {
    title: product.seoTitle ?? `${product.name}${product.brand ? ` — ${product.brand.name}` : ""}`,
    description,
    alternates: { canonical: `/p/${product.slug}` },
    openGraph: { title: product.name, description, images: product.images.slice(0, 1).map((i) => ({ url: i.url, width: i.width, height: i.height, alt: i.alt })), type: "website" },
  };
}

export default async function ProductPage({ params }: Props) {
  const [{ slug }, t, ctx] = await Promise.all([params, getT(), getPricingContext()]);
  const { product, archived, categoryHref } = await getProductDetail(slug, ctx);

  if (!product) {
    if (!archived) notFound();
    return (
      <Section>
        <EmptyState icon={<PackageX />} size="lg" title={t("catalog.pdp.unavailable.title")} description={t("catalog.pdp.unavailable.desc")} actions={
          <>
            {categoryHref && <Button asChild><Link href={categoryHref}>{t("catalog.pdp.unavailable.cta")}</Link></Button>}
            <Button asChild variant="outline"><Link href="/c">{t("common.actions.backToCatalog")}</Link></Button>
          </>
        } />
      </Section>
    );
  }

  const [promotions, settings, related] = await Promise.all([getActivePromotions(), getSettings(), getRelatedProducts(product.id, product.category.id, ctx)]);
  after(() => incrementViewCount(product.id));

  const crumbs = [{ label: t("common.breadcrumb.home"), href: "/" }, ...product.breadcrumb, { label: product.name }];
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const inStock = product.variants.some((v) => v.availability.status !== "out_of_stock");

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          productJsonLd({
            name: product.name,
            description: product.shortDescription ?? markdownToText(product.description, 300),
            sku: defaultVariant.sku,
            slug: product.slug,
            brand: product.brand?.name ?? null,
            images: product.images.map((i) => i.url),
            price: defaultVariant.initial.hidden ? null : defaultVariant.initial.unitPrice,
            currency: siteConfig.currency,
            inStock,
            ratingAvg: product.ratingAvg,
            ratingCount: product.ratingCount,
          }),
        ]}
      />
      <Section className="py-5 md:py-8">
        <Breadcrumb items={crumbs} label={t("common.breadcrumb.label")} className="mb-5" />
        <ProductView
          product={product}
          buyBox={{
            productName: product.name,
            productSlug: product.slug,
            brand: product.brand,
            hasVariants: product.hasVariants,
            options: product.options,
            variants: product.variants,
            ctx: serializeContext(ctx),
            promotions: serializePromotions(promotions),
            taxDisplay: settings.taxDisplay,
            freeShippingThreshold: settings.freeShippingThreshold,
            leadTime: settings.defaultLeadTime,
            shortDescription: product.shortDescription,
          }}
        />
      </Section>

      <Section bordered className="py-8 md:py-12">
        <ProductInfoTabs product={product} leadTime={settings.defaultLeadTime} />
      </Section>

      {related.frequentlyBought.length > 0 && (
        <Section bordered className="py-8 md:py-12">
          <div className="max-w-3xl"><RelatedSelection products={related.frequentlyBought} title={t("catalog.pdp.related.frequentlyBought")} /></div>
        </Section>
      )}
      {related.complementary.length > 0 && (
        <Section bordered className="py-8 md:py-12">
          <SectionHeader title={t("catalog.pdp.related.complete")} />
          <ProductRail products={related.complementary} listId="pdp_complementary" />
        </Section>
      )}
      {related.similar.length > 0 && (
        <Section bordered className="py-8 md:py-12">
          <SectionHeader title={t("catalog.pdp.related.similar")} cta={categoryHref ? { label: t("common.actions.seeCategory"), href: categoryHref } : null} />
          <ProductRail products={related.similar} listId="pdp_similar" />
        </Section>
      )}
      {related.alsoBuy.length > 0 && (
        <Section bordered className="py-8 md:py-12">
          <SectionHeader title={t("catalog.pdp.related.alsoBuy")} />
          <ProductRail products={related.alsoBuy} listId="pdp_also_buy" />
        </Section>
      )}
    </>
  );
}
