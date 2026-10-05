import { siteConfig } from "@/lib/config/site";

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(settings: { supportEmail: string; supportPhone: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon`,
    contactPoint: [{ "@type": "ContactPoint", contactType: "customer service", email: settings.supportEmail, telephone: settings.supportPhone, availableLanguage: ["fr"] }],
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteConfig.url}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { label: string; href?: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${siteConfig.url}${item.href}` } : {}),
    })),
  };
}

export function productJsonLd(p: {
  name: string;
  description: string;
  sku: string;
  slug: string;
  brand: string | null;
  images: string[];
  price: number | null;
  currency: string;
  inStock: boolean;
  ratingAvg?: number | null;
  ratingCount?: number;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    sku: p.sku,
    image: p.images.map((u) => (u.startsWith("http") ? u : `${siteConfig.url}${u}`)),
    url: `${siteConfig.url}/p/${p.slug}`,
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
    ...(p.price !== null
      ? {
          offers: {
            "@type": "Offer",
            url: `${siteConfig.url}/p/${p.slug}`,
            priceCurrency: p.currency,
            price: (p.price / 100).toFixed(2),
            priceSpecification: { "@type": "UnitPriceSpecification", price: (p.price / 100).toFixed(2), priceCurrency: p.currency, valueAddedTaxIncluded: false },
            availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            businessFunction: "http://purl.org/goodrelations/v1#Sell",
            eligibleCustomerType: "http://purl.org/goodrelations/v1#Business",
          },
        }
      : {}),
    ...(p.ratingAvg && p.ratingCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.ratingAvg, reviewCount: p.ratingCount } } : {}),
  };
}

export function articleJsonLd(a: { title: string; description: string; slug: string; image: string | null; author: string | null; publishedAt: Date | null; updatedAt: Date }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    url: `${siteConfig.url}/guides/${a.slug}`,
    ...(a.image ? { image: a.image.startsWith("http") ? a.image : `${siteConfig.url}${a.image}` } : {}),
    author: { "@type": "Organization", name: a.author ?? siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
    datePublished: a.publishedAt?.toISOString(),
    dateModified: a.updatedAt.toISOString(),
  };
}

/** Composant serveur : script JSON-LD sûr. */
export function JsonLd({ data }: { data: JsonLd | JsonLd[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
