import Link from "next/link";
import { getT } from "@/i18n/server";
import { formatMoney } from "@/lib/money";
import type { CartDetail } from "@/services/cart";
import { ProductImage } from "@/components/commerce/product-image";
import { CartSummary } from "@/components/cart/cart-summary";

/** Colonne récapitulative des étapes du checkout. */
export async function OrderReview({ cart, minimumOrderAmount }: { cart: CartDetail; minimumOrderAmount: number }) {
  const t = await getT();
  return (
    <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-semibold">{t.plural("checkout.review.items", cart.itemCount)}</p>
          <Link href="/cart" className="text-xs text-muted underline underline-offset-2 hover:text-foreground">{t("checkout.review.edit")}</Link>
        </div>
        <ul className="max-h-80 divide-y divide-border overflow-y-auto px-5">
          {cart.items.map((l) => (
            <li key={l.itemId} className="flex items-center gap-3 py-3 text-sm">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-paper-2"><ProductImage src={l.image?.url} alt="" sizes="48px" /></span>
              <span className="min-w-0 flex-1"><span className="line-clamp-1 font-medium">{l.name}</span><span className="text-xs text-muted">{l.quantity} × {formatMoney(l.unit.unitPrice)}</span></span>
              <span className="font-semibold tnum">{formatMoney(l.lineSubtotal)}</span>
            </li>
          ))}
        </ul>
      </div>
      <CartSummary totals={cart.totals} couponCode={cart.couponCode} couponError={cart.couponError} canCheckout checkoutBlockedReason={null} checkoutHref="/checkout" minimumOrderAmount={minimumOrderAmount} itemCount={cart.itemCount} compact />
    </div>
  );
}
