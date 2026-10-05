import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, getPricingContext, canOrder, type CurrentUser } from "@/lib/auth/dal";
import { getCartDetail, type CartDetail } from "@/services/cart";
import { getShippingOption } from "@/services/orders";
import { readCheckoutState, type CheckoutState } from "@/app/actions/checkout";
import { db } from "@/lib/db";
import type { ShippingOption } from "@/lib/pricing/types";

/** Pré-conditions communes aux étapes du checkout. */
export async function loadCheckout(step: "information" | "shipping" | "payment") {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");
  if (!user.business || !canOrder(user)) redirect("/cart");
  const ctx = await getPricingContext();
  const state = await readCheckoutState();
  let shipping: ShippingOption | null = null;
  let shippingAddress = null;
  let billingAddress = null;
  if (step !== "information") {
    if (!state.billingAddressId || !state.shippingAddressId) redirect("/checkout");
    [billingAddress, shippingAddress] = await Promise.all([
      db.address.findFirst({ where: { id: state.billingAddressId, businessId: user.business.id } }),
      db.address.findFirst({ where: { id: state.shippingAddressId, businessId: user.business.id } }),
    ]);
    if (!billingAddress || !shippingAddress) redirect("/checkout");
  }
  if (step === "payment") {
    if (!state.shippingMethodCode) redirect("/checkout/shipping");
    shipping = await getShippingOption(state.shippingMethodCode, shippingAddress!.countryCode);
    if (!shipping) redirect("/checkout/shipping");
  }
  const cart = await getCartDetail(user, ctx, shipping);
  if (!cart || cart.items.length === 0) redirect("/cart");
  if (cart.hasUnavailable || cart.hasQuoteOnly || cart.items.some((l) => l.unit.hidden)) redirect("/cart");
  return { user: user as CurrentUser & { business: NonNullable<CurrentUser["business"]> }, ctx, state: state as CheckoutState, cart: cart as CartDetail, billingAddress, shippingAddress, shipping };
}
