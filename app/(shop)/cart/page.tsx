import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { getT } from "@/i18n/server";
import { getCurrentUser, getPricingContext, canOrder } from "@/lib/auth/dal";
import { getCartDetail } from "@/services/cart";
import { getSettings } from "@/services/settings";
import { getBestsellers } from "@/services/catalog/products";
import { formatMoney } from "@/lib/money";
import { Section, SectionHeader } from "@/components/layout/section";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ProductRail } from "@/components/commerce/product-grid";
import { CartLine } from "@/components/cart/cart-line";
import { CartSummary } from "@/components/cart/cart-summary";
import { CartTools } from "@/components/cart/cart-tools";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("cart.title"), robots: { index: false } };
}

export default async function CartPage() {
  const [t, user, ctx, settings] = await Promise.all([getT(), getCurrentUser(), getPricingContext(), getSettings()]);
  const cart = await getCartDetail(user, ctx);

  if (!cart || cart.items.length === 0) {
    const suggestions = await getBestsellers(ctx, 8);
    return (
      <Section>
        <h1 className="t-h1 mb-6">{t("cart.title")}</h1>
        <EmptyState icon={<ShoppingCart />} size="lg" title={t("cart.empty.title")} description={t("cart.empty.desc")} actions={
          <>
            <Button asChild><Link href="/c">{t("cart.empty.browse")}</Link></Button>
            {user?.business && <Button asChild variant="outline"><Link href="/account/lists">{t("cart.empty.lists")}</Link></Button>}
            {user?.business && <Button asChild variant="outline"><Link href="/account/orders">{t("cart.empty.orders")}</Link></Button>}
            <Button asChild variant="outline"><Link href="/quick-order">{t("cart.empty.quickOrder")}</Link></Button>
          </>
        } />
        {suggestions.length > 0 && (
          <div className="mt-14">
            <SectionHeader title={t("home.bestsellers.title")} />
            <ProductRail products={suggestions} listId="cart_empty_bestsellers" />
          </div>
        )}
      </Section>
    );
  }

  let blocked: string | null = null;
  if (!user) blocked = t("checkout.loginPrompt.desc");
  else if (!canOrder(user)) blocked = user.business?.status === "SUSPENDED" ? t("checkout.errors.businessSuspended") : t("checkout.errors.businessNotApproved");
  else if (cart.hasUnavailable) blocked = t("cart.item.unavailable");
  else if (cart.hasQuoteOnly) blocked = t("cart.item.quoteRequired");
  const canCheckout = blocked === null;

  const warnings = cart.warnings.map((w) => {
    switch (w.type) {
      case "price_changed": return t("cart.warnings.priceChanged", { name: w.name, old: formatMoney(w.old ?? 0), new: formatMoney(w.new ?? 0) });
      case "unavailable": return t("cart.warnings.unavailable", { name: w.name });
      case "quantity_adjusted": return t("cart.warnings.quantityAdjusted", { name: w.name, quantity: w.quantity ?? 0 });
      case "moq_changed": return t("cart.warnings.moqChanged", { name: w.name, min: w.min ?? 0 });
      case "stock": return t("common.errors.outOfStock", { available: w.quantity ?? 0 }) + ` — ${w.name}`;
    }
  });

  const nudge = cart.items.filter((l) => l.nextTier && !l.unavailable).sort((a, b) => (b.nextTier!.savingsPercent - a.nextTier!.savingsPercent))[0];

  return (
    <Section className="py-6 md:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="t-h1">{t("cart.titleWithCount", { count: cart.itemCount })}</h1>
        <CartTools lines={cart.items} />
      </div>
      {warnings.length > 0 && (
        <Alert tone="warning" title={t("cart.warnings.title")} className="mb-6">
          <ul className="list-disc space-y-0.5 ps-4">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </Alert>
      )}
      {nudge?.nextTier && (
        <Alert tone="success" className="mb-6">{t("cart.summary.tierNudge", { count: nudge.nextTier.quantityToAdd, unit: nudge.unitLabel + (nudge.nextTier.quantityToAdd > 1 ? "s" : ""), name: nudge.name, percent: nudge.nextTier.savingsPercent })}</Alert>
      )}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-lg border border-border bg-surface px-4 sm:px-5">
          <ul className="divide-y divide-border">
            {cart.items.map((line) => <CartLine key={line.itemId} line={line} showListButton={!!user?.business} />)}
          </ul>
          <div className="flex items-center justify-between border-t border-border py-4">
            <Link href="/c" className="text-sm font-medium underline underline-offset-2">{t("cart.summary.continueShopping")}</Link>
            <Link href="/quick-order" className="text-sm text-muted hover:text-foreground">{t("nav.header.quickOrder")}</Link>
          </div>
        </div>
        <div className="lg:sticky lg:top-32 lg:self-start">
          <CartSummary totals={cart.totals} couponCode={cart.couponCode} couponError={cart.couponError} canCheckout={canCheckout} checkoutBlockedReason={blocked} checkoutHref={user ? "/checkout" : "/login?next=/checkout"} minimumOrderAmount={settings.minimumOrderAmount} itemCount={cart.itemCount} quoteHref="/quote?from=cart" />
        </div>
      </div>
    </Section>
  );
}
