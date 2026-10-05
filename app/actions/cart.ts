"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, getPricingContext, type ActionResult } from "@/lib/auth/dal";
import { addToCartSchema, updateCartItemSchema, couponSchema, bulkAddSchema } from "@/lib/validation/cart";
import { addToCart, updateCartItemQuantity, removeCartItem, clearCart, setCartCoupon, resolveCoupon, getCartCount, addManyToCart, type CartError } from "@/services/cart";
import { getT } from "@/i18n/server";

function cartErrorMessage(t: Awaited<ReturnType<typeof getT>>, error: CartError, extra?: { available?: number; min?: number }): string {
  switch (error) {
    case "out_of_stock":
      return t("common.errors.outOfStock", { available: extra?.available ?? 0 });
    case "quote_required":
      return t("catalog.card.quoteOnly");
    case "hidden_price":
      return t("catalog.card.loginForPrice");
    case "invalid_quantity":
      return t("common.errors.invalidQuantity");
    default:
      return t("common.errors.productUnavailable");
  }
}

export async function addToCartAction(input: { variantId: string; quantity: number }): Promise<ActionResult<{ quantity: number; cartCount: number }>> {
  const t = await getT();
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.invalidQuantity") };
  const [user, ctx] = await Promise.all([getCurrentUser(), getPricingContext()]);
  const result = await addToCart(user, ctx, parsed.data.variantId, parsed.data.quantity);
  if (!result.ok) return { ok: false, error: cartErrorMessage(t, result.error, result) };
  revalidatePath("/", "layout");
  const cartCount = await getCartCount(user);
  return { ok: true, data: { quantity: result.quantity, cartCount }, message: t("common.toasts.addedToCart") };
}

export async function addManyToCartAction(input: { items: { variantId: string; quantity: number }[] }): Promise<ActionResult<{ added: number; failed: number; cartCount: number }>> {
  const t = await getT();
  const parsed = bulkAddSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const [user, ctx] = await Promise.all([getCurrentUser(), getPricingContext()]);
  const results = await addManyToCart(user, ctx, parsed.data.items);
  revalidatePath("/", "layout");
  const added = results.filter((r) => r.ok).length;
  const cartCount = await getCartCount(user);
  return { ok: true, data: { added, failed: results.length - added, cartCount }, message: t.plural("common.toasts.addedToCart", added) };
}

export async function updateCartItemAction(input: { itemId: string; quantity: number }): Promise<ActionResult<{ quantity: number }>> {
  const t = await getT();
  const parsed = updateCartItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.invalidQuantity") };
  const [user, ctx] = await Promise.all([getCurrentUser(), getPricingContext()]);
  const result = await updateCartItemQuantity(user, ctx, parsed.data.itemId, parsed.data.quantity);
  if (!result.ok) return { ok: false, error: cartErrorMessage(t, result.error, result) };
  revalidatePath("/", "layout");
  return { ok: true, data: { quantity: result.quantity } };
}

export async function removeCartItemAction(input: { itemId: string }): Promise<ActionResult> {
  const t = await getT();
  const parsed = z.object({ itemId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.generic") };
  const user = await getCurrentUser();
  await removeCartItem(user, parsed.data.itemId);
  revalidatePath("/", "layout");
  return { ok: true, message: t("common.toasts.removedFromCart") };
}

export async function clearCartAction(): Promise<ActionResult> {
  const user = await getCurrentUser();
  await clearCart(user);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function applyCouponAction(input: { code: string }): Promise<ActionResult> {
  const t = await getT();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("cart.summary.couponInvalid") };
  const [user, ctx] = await Promise.all([getCurrentUser(), getPricingContext()]);
  const { coupon } = await resolveCoupon(parsed.data.code, ctx);
  if (!coupon) return { ok: false, error: t("cart.summary.couponInvalid") };
  await setCartCoupon(user, coupon.code);
  revalidatePath("/cart");
  revalidatePath("/checkout", "layout");
  return { ok: true, message: t("cart.summary.couponApplied", { code: coupon.code }) };
}

export async function removeCouponAction(): Promise<ActionResult> {
  const user = await getCurrentUser();
  await setCartCoupon(user, null);
  revalidatePath("/cart");
  revalidatePath("/checkout", "layout");
  return { ok: true };
}
