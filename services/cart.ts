import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { db, type Prisma } from "@/lib/db";
import type { PricingContext, PricingPromotion, UnitPriceResult, CartTotals, LineResult, ShippingOption } from "@/lib/pricing/types";
import { calculateLine, calculateCartTotals } from "@/lib/pricing/engine";
import { normalizeQuantity } from "@/lib/pricing/quantity";
import { isPromotionActive } from "@/lib/pricing/promotions";
import { generateToken } from "@/lib/auth/tokens";
import { buildPricingInput, getActivePromotions, getAvailability, variantPricingInclude, type Availability } from "@/services/pricing";
import { getDefaultTaxRateBps, getSettings } from "@/services/settings";
import type { CurrentUser } from "@/lib/auth/dal";

export const CART_COOKIE = "kayen_cart";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export interface CartLineView {
  itemId: string;
  variantId: string;
  productId: string;
  slug: string;
  href: string;
  name: string;
  variantName: string | null;
  sku: string;
  brandName: string | null;
  image: { url: string; alt: string } | null;
  unitLabel: string;
  packagingLabel: string | null;
  moq: number;
  orderMultiple: number;
  quantity: number;
  unit: UnitPriceResult;
  lineSubtotal: number;
  baseSubtotal: number;
  savings: number;
  availability: { status: Availability["status"]; available: number; allowBackorder: boolean };
  priceChanged: { old: number; new: number } | null;
  unavailable: boolean;
  requiresQuote: boolean;
  nextTier: { quantityToAdd: number; savingsPercent: number } | null;
}

export interface CartWarning {
  type: "price_changed" | "unavailable" | "quantity_adjusted" | "moq_changed" | "stock";
  name: string;
  old?: number;
  new?: number;
  quantity?: number;
  min?: number;
}

export interface CartDetail {
  id: string;
  items: CartLineView[];
  totals: CartTotals;
  warnings: CartWarning[];
  couponCode: string | null;
  couponError: string | null;
  itemCount: number;
  hasUnavailable: boolean;
  hasQuoteOnly: boolean;
  name: string | null;
}

export type CartError = "variant_not_found" | "out_of_stock" | "invalid_quantity" | "quote_required" | "hidden_price";

/** Lit l'identifiant de panier invité (cookie). */
async function readGuestToken(): Promise<string | null> {
  try {
    return (await cookies()).get(CART_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

/** Panier actif (lecture seule). Null si inexistant. */
export const getActiveCart = cache(async (user: CurrentUser | null) => {
  if (user) {
    return db.cart.findFirst({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { updatedAt: "desc" } });
  }
  const token = await readGuestToken();
  if (!token) return null;
  return db.cart.findFirst({ where: { token, status: "ACTIVE" } });
});

/** Panier actif, créé si nécessaire (à utiliser dans les actions : peut poser un cookie). */
export async function getOrCreateCart(user: CurrentUser | null) {
  const existing = await getActiveCart(user);
  if (existing) return existing;
  if (user) {
    return db.cart.create({ data: { userId: user.id, businessId: user.business?.id ?? null, status: "ACTIVE" } });
  }
  const token = generateToken(24);
  const cart = await db.cart.create({ data: { token, status: "ACTIVE", expiresAt: new Date(Date.now() + CART_COOKIE_MAX_AGE * 1000) } });
  const store = await cookies();
  store.set(CART_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: CART_COOKIE_MAX_AGE });
  return cart;
}

/** Nombre d'articles (pour l'en-tête). */
export async function getCartCount(user: CurrentUser | null): Promise<number> {
  const cart = await getActiveCart(user);
  if (!cart) return 0;
  const agg = await db.cartItem.aggregate({ where: { cartId: cart.id }, _sum: { quantity: true } });
  return agg._sum.quantity ?? 0;
}

function cartItemInclude(ctx: PricingContext) {
  return {
    variant: {
      include: {
        ...variantPricingInclude(ctx),
        product: {
          select: {
            id: true, slug: true, name: true, status: true, categoryId: true, brandId: true, requiresAccount: true,
            taxClass: { select: { rateBps: true } },
            brand: { select: { name: true } },
            images: { orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }], take: 1, select: { url: true, alt: true } },
          },
        },
      },
    },
  } satisfies Prisma.CartItemInclude;
}

/** Résout un code promo : promotion valide + limites d'usage. */
export async function resolveCoupon(code: string, ctx: PricingContext): Promise<{ coupon: { code: string; promotion: PricingPromotion } | null; error: string | null }> {
  const upper = code.trim().toUpperCase();
  const row = await db.coupon.findUnique({ where: { code: upper }, include: { promotion: { include: { products: true, categories: true, brands: true } } } });
  if (!row || !row.isActive || !row.promotion.isActive) return { coupon: null, error: "invalid" };
  const now = ctx.now;
  if ((row.startsAt && row.startsAt > now) || (row.endsAt && row.endsAt < now)) return { coupon: null, error: "expired" };
  if (row.maxUses !== null && row.usesCount >= row.maxUses) return { coupon: null, error: "exhausted" };
  const p = row.promotion;
  const promotion: PricingPromotion = {
    id: p.id, name: p.name, type: p.type, scope: p.scope, valueBps: p.valueBps, valueAmount: p.valueAmount, specialPrice: p.specialPrice,
    minQuantity: p.minQuantity, minOrderAmount: p.minOrderAmount, priority: p.priority, isAutomatic: p.isAutomatic, showBadge: p.showBadge,
    badgeLabel: p.badgeLabel, startsAt: p.startsAt, endsAt: p.endsAt, customerGroupId: p.customerGroupId,
    productIds: p.products.map((x) => x.productId), categoryIds: p.categories.map((x) => x.categoryId), brandIds: p.brands.map((x) => x.brandId),
  };
  if (!isPromotionActive(promotion, ctx)) return { coupon: null, error: "expired" };
  if (p.maxUses !== null && p.usesCount >= p.maxUses) return { coupon: null, error: "exhausted" };
  if (p.maxUsesPerCustomer !== null && ctx.businessId) {
    const used = await db.promotionUsage.count({ where: { promotionId: p.id, businessId: ctx.businessId } });
    if (used >= p.maxUsesPerCustomer) return { coupon: null, error: "exhausted" };
  }
  if (promotion.scope !== "ORDER") return { coupon: null, error: "invalid" };
  return { coupon: { code: upper, promotion }, error: null };
}

/**
 * Détail complet du panier : lignes tarifées par le moteur, avertissements, totaux.
 * `shipping` optionnel (checkout) ; sans livraison, le total est hors frais de port.
 */
export async function getCartDetail(user: CurrentUser | null, ctx: PricingContext, shipping: ShippingOption | null = null): Promise<CartDetail | null> {
  const cart = await getActiveCart(user);
  if (!cart) return null;
  const [items, promotions, settings, defaultTax] = await Promise.all([
    db.cartItem.findMany({ where: { cartId: cart.id }, include: cartItemInclude(ctx), orderBy: { addedAt: "asc" } }),
    getActivePromotions(),
    getSettings(),
    getDefaultTaxRateBps(),
  ]);
  const warnings: CartWarning[] = [];
  const views: CartLineView[] = [];
  const lines: LineResult[] = [];

  for (const item of items) {
    const v = item.variant;
    const unavailable = !v.isActive || v.product.status !== "ACTIVE";
    const input = await buildPricingInput(v);
    const quantity = normalizeQuantity(item.quantity, v.moq, v.orderMultiple);
    if (quantity !== item.quantity) warnings.push({ type: "quantity_adjusted", name: v.product.name, quantity, min: v.moq });
    const line = calculateLine({ variantId: v.id, productId: v.productId, quantity, pricing: input }, ctx, promotions);
    const availability = getAvailability(v);
    const priceChanged = !unavailable && item.unitPriceAtAdd !== line.unit.unitPrice && !line.unit.hidden ? { old: item.unitPriceAtAdd, new: line.unit.unitPrice } : null;
    if (priceChanged) warnings.push({ type: "price_changed", name: v.product.name, old: priceChanged.old, new: priceChanged.new });
    if (unavailable) warnings.push({ type: "unavailable", name: v.product.name });
    else if (availability.status === "out_of_stock" || (!availability.allowBackorder && quantity > availability.available)) {
      warnings.push({ type: "stock", name: v.product.name, quantity: availability.available });
    }
    views.push({
      itemId: item.id,
      variantId: v.id,
      productId: v.productId,
      slug: v.product.slug,
      href: `/p/${v.product.slug}`,
      name: v.product.name,
      variantName: v.name,
      sku: v.sku,
      brandName: v.product.brand?.name ?? null,
      image: v.product.images[0] ?? null,
      unitLabel: v.unitLabel,
      packagingLabel: v.packagingLabel,
      moq: v.moq,
      orderMultiple: v.orderMultiple,
      quantity,
      unit: line.unit,
      lineSubtotal: unavailable ? 0 : line.lineSubtotal,
      baseSubtotal: unavailable ? 0 : line.baseSubtotal,
      savings: unavailable ? 0 : line.savings,
      availability: { status: availability.status, available: availability.available, allowBackorder: availability.allowBackorder },
      priceChanged,
      unavailable,
      requiresQuote: line.unit.requiresQuote,
      nextTier: line.unit.nextTier ? { quantityToAdd: line.unit.nextTier.quantityToAdd, savingsPercent: line.unit.nextTier.savingsPercent } : null,
    });
    if (!unavailable && !line.unit.hidden) lines.push(line);
  }

  let coupon: { code: string; promotion: PricingPromotion } | null = null;
  let couponError: string | null = null;
  if (cart.couponCode) {
    const resolved = await resolveCoupon(cart.couponCode, ctx);
    coupon = resolved.coupon;
    couponError = resolved.error;
  }
  const orderPromotions = promotions.filter((p) => p.scope === "ORDER" && p.isAutomatic && isPromotionActive(p, ctx));
  const totals = calculateCartTotals({ lines, orderPromotions, coupon, shipping, shippingTaxRateBps: defaultTax, freeShippingThreshold: settings.freeShippingThreshold });
  return {
    id: cart.id,
    items: views,
    totals,
    warnings,
    couponCode: cart.couponCode,
    couponError,
    itemCount: views.reduce((s, l) => s + (l.unavailable ? 0 : l.quantity), 0),
    hasUnavailable: views.some((l) => l.unavailable),
    hasQuoteOnly: views.some((l) => l.requiresQuote),
    name: cart.name,
  };
}

/** Ajoute (ou cumule) une variante au panier. Vérifie MOQ, pas, stock et visibilité du prix. */
export async function addToCart(user: CurrentUser | null, ctx: PricingContext, variantId: string, requestedQuantity: number): Promise<{ ok: true; quantity: number; itemId: string } | { ok: false; error: CartError; available?: number; min?: number }> {
  const variant = await db.productVariant.findFirst({ where: { id: variantId, isActive: true, product: { status: "ACTIVE" } }, include: variantPricingInclude(ctx) });
  if (!variant) return { ok: false, error: "variant_not_found" };
  if (variant.product.requiresAccount && !ctx.isAuthenticated) return { ok: false, error: "hidden_price" };
  const cart = await getOrCreateCart(user);
  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
  const quantity = normalizeQuantity((existing?.quantity ?? 0) + requestedQuantity, variant.moq, variant.orderMultiple);
  if (variant.quoteOnlyAbove !== null && quantity >= variant.quoteOnlyAbove) return { ok: false, error: "quote_required", min: variant.quoteOnlyAbove };
  const availability = getAvailability(variant);
  if (!availability.allowBackorder && quantity > availability.available) return { ok: false, error: "out_of_stock", available: availability.available };
  const input = await buildPricingInput(variant);
  const unit = calculateLine({ variantId, productId: variant.productId, quantity, pricing: input }, ctx, await getActivePromotions()).unit;
  const item = await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity, unitPriceAtAdd: unit.unitPrice },
    update: { quantity, unitPriceAtAdd: unit.unitPrice },
  });
  await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
  return { ok: true, quantity, itemId: item.id };
}

export async function updateCartItemQuantity(user: CurrentUser | null, ctx: PricingContext, itemId: string, requestedQuantity: number): Promise<{ ok: true; quantity: number } | { ok: false; error: CartError; available?: number }> {
  const cart = await getActiveCart(user);
  if (!cart) return { ok: false, error: "variant_not_found" };
  const item = await db.cartItem.findFirst({ where: { id: itemId, cartId: cart.id }, include: { variant: { include: variantPricingInclude(ctx) } } });
  if (!item) return { ok: false, error: "variant_not_found" };
  if (requestedQuantity <= 0) {
    await db.cartItem.delete({ where: { id: item.id } });
    return { ok: true, quantity: 0 };
  }
  const quantity = normalizeQuantity(requestedQuantity, item.variant.moq, item.variant.orderMultiple);
  if (item.variant.quoteOnlyAbove !== null && quantity >= item.variant.quoteOnlyAbove) return { ok: false, error: "quote_required" };
  const availability = getAvailability(item.variant);
  if (!availability.allowBackorder && quantity > availability.available) return { ok: false, error: "out_of_stock", available: availability.available };
  const input = await buildPricingInput(item.variant);
  const unit = calculateLine({ variantId: item.variantId, productId: item.variant.productId, quantity, pricing: input }, ctx, await getActivePromotions()).unit;
  await db.cartItem.update({ where: { id: item.id }, data: { quantity, unitPriceAtAdd: unit.unitPrice } });
  return { ok: true, quantity };
}

export async function removeCartItem(user: CurrentUser | null, itemId: string): Promise<boolean> {
  const cart = await getActiveCart(user);
  if (!cart) return false;
  const res = await db.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  return res.count > 0;
}

export async function clearCart(user: CurrentUser | null): Promise<void> {
  const cart = await getActiveCart(user);
  if (!cart) return;
  await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
}

export async function setCartCoupon(user: CurrentUser | null, code: string | null): Promise<void> {
  const cart = await getOrCreateCart(user);
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: code } });
}

/** Fusionne le panier invité dans le panier de l'utilisateur (à la connexion), sans doublon. */
export async function mergeGuestCart(user: CurrentUser): Promise<{ merged: number }> {
  const token = await readGuestToken();
  if (!token) return { merged: 0 };
  const guest = await db.cart.findFirst({ where: { token, status: "ACTIVE" }, include: { items: true } });
  if (!guest) return { merged: 0 };
  let userCart = await db.cart.findFirst({ where: { userId: user.id, status: "ACTIVE" } });
  if (!userCart) {
    await db.cart.update({ where: { id: guest.id }, data: { userId: user.id, businessId: user.business?.id ?? null, token: null, expiresAt: null } });
    return { merged: guest.items.length };
  }
  let merged = 0;
  for (const item of guest.items) {
    const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } } });
    if (existing) {
      await db.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + item.quantity } });
    } else {
      await db.cartItem.create({ data: { cartId: userCart.id, variantId: item.variantId, quantity: item.quantity, unitPriceAtAdd: item.unitPriceAtAdd } });
    }
    merged += 1;
  }
  if (guest.couponCode && !userCart.couponCode) {
    userCart = await db.cart.update({ where: { id: userCart.id }, data: { couponCode: guest.couponCode } });
  }
  await db.cart.delete({ where: { id: guest.id } });
  const store = await cookies();
  store.set(CART_COOKIE, "", { path: "/", maxAge: 0 });
  return { merged };
}

/** Ajout groupé (listes, recommande, commande rapide). Retourne le détail des ajouts. */
export async function addManyToCart(user: CurrentUser | null, ctx: PricingContext, items: { variantId: string; quantity: number }[]) {
  const results: { variantId: string; ok: boolean; error?: CartError; quantity?: number; available?: number }[] = [];
  for (const it of items) {
    const r = await addToCart(user, ctx, it.variantId, it.quantity);
    results.push(r.ok ? { variantId: it.variantId, ok: true, quantity: r.quantity } : { variantId: it.variantId, ok: false, error: r.error, available: r.available });
  }
  return results;
}
