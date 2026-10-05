import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { getCurrentUser, getPricingContext } from "@/lib/auth/dal";
import { getCartDetail } from "@/services/cart";
import { db } from "@/lib/db";
import { Section } from "@/components/layout/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { QuoteForm, type QuoteFormItem } from "@/components/quote/quote-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("quote.page.title"), description: t("quote.page.subtitle"), alternates: { canonical: "/quote" } };
}

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ sku?: string; qty?: string; from?: string }> }) {
  const [t, sp, user, ctx] = await Promise.all([getT(), searchParams, getCurrentUser(), getPricingContext()]);
  const source: "PRODUCT" | "CART" | "CONTACT" = sp.from === "cart" ? "CART" : sp.sku ? "PRODUCT" : "CONTACT";
  const items: QuoteFormItem[] = [];
  let cartCount = 0;
  if (source === "PRODUCT" && sp.sku) {
    const variant = await db.productVariant.findFirst({ where: { sku: { equals: sp.sku, mode: "insensitive" } }, include: { product: { select: { name: true } } } });
    if (variant) items.push({ variantId: variant.id, sku: variant.sku, name: variant.name ? `${variant.product.name} — ${variant.name}` : variant.product.name, quantity: Math.max(1, Number.parseInt(sp.qty ?? "1", 10) || 1) });
  }
  if (source === "CART") {
    const cart = await getCartDetail(user, ctx);
    cartCount = cart?.items.filter((l) => !l.unavailable).length ?? 0;
  }
  const steps = [
    { title: t("quote.page.step1.title"), desc: t("quote.page.step1.desc") },
    { title: t("quote.page.step2.title"), desc: t("quote.page.step2.desc") },
    { title: t("quote.page.step3.title"), desc: t("quote.page.step3.desc") },
  ];

  return (
    <Section className="py-6 md:py-10">
      <Breadcrumb items={[{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("quote.page.title") }]} label={t("common.breadcrumb.label")} className="mb-4" />
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="t-h1">{t("quote.page.title")}</h1>
          <p className="mt-3 max-w-2xl text-muted">{t("quote.page.subtitle")}</p>
          <div className="mt-8 rounded-xl border border-border bg-surface p-5 md:p-8">
            <QuoteForm source={source} initialItems={items} cartCount={cartCount} defaults={{ companyName: user?.business?.name, contactName: user?.fullName, email: user?.email, phone: user?.phone ?? undefined }} />
          </div>
        </div>
        <aside className="lg:pt-16">
          <div className="rounded-xl bg-ink p-6 text-white">
            <p className="t-label text-white/70">{t("quote.page.howItWorks")}</p>
            <ol className="mt-4 space-y-4">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-white/70">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-xs text-white/70">{t("quote.page.benefits")}</p>
          </div>
        </aside>
      </div>
    </Section>
  );
}
