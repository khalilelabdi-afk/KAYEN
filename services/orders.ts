import "server-only";
import { db, type Prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/dal";
import type { PricingContext, ShippingOption } from "@/lib/pricing/types";
import { getCartDetail, getActiveCart } from "@/services/cart";
import { getShippingMethods, getSettings } from "@/services/settings";
import { getPaymentProvider } from "@/lib/payments/providers";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail, orderShippedEmail, orderDeliveredEmail, invoiceAvailableEmail, type OrderEmailData } from "@/emails";
import { nextNumber } from "./numbering";
import { normalizeQuantity } from "@/lib/pricing/quantity";

export interface AddressSnapshot {
  label?: string | null;
  company?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  line1: string;
  line2?: string | null;
  postalCode: string;
  city: string;
  region?: string | null;
  countryCode: string;
  phone?: string | null;
  instructions?: string | null;
}

export function formatAddress(a: AddressSnapshot): string {
  return [a.company, [a.firstName, a.lastName].filter(Boolean).join(" ") || null, a.line1, a.line2, `${a.postalCode} ${a.city}`, a.countryCode].filter(Boolean).join(", ");
}

export async function getShippingOption(code: string, countryCode: string): Promise<ShippingOption | null> {
  const methods = await getShippingMethods();
  const m = methods.find((x) => x.code === code && (x.countryCodes.length === 0 || x.countryCodes.includes(countryCode)));
  return m ? { code: m.code, name: m.name, price: m.price, freeAbove: m.freeAbove } : null;
}

export interface PlaceOrderInput {
  billingAddress: AddressSnapshot;
  shippingAddress: AddressSnapshot;
  shippingMethodCode: string;
  paymentMethod: "CARD" | "BANK_TRANSFER" | "INVOICE";
  paymentPayload?: Record<string, string | undefined>;
  poReference?: string | null;
  deliveryInstructions?: string | null;
  notes?: string | null;
}

export type PlaceOrderResult =
  | { ok: true; orderId: string; number: string }
  | { ok: false; error: "cart_empty" | "cart_changed" | "stock" | "shipping_invalid" | "payment_failed" | "payment_not_allowed" | "minimum_order"; detail?: string };

/**
 * Validation finale et création de commande. Tout est recalculé côté serveur :
 * produits, statut, stock, MOQ, prix, remises, taxes, livraison, total.
 */
export async function placeOrder(user: CurrentUser & { business: NonNullable<CurrentUser["business"]> }, ctx: PricingContext, input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const shipping = await getShippingOption(input.shippingMethodCode, input.shippingAddress.countryCode);
  if (!shipping) return { ok: false, error: "shipping_invalid" };
  if (input.paymentMethod === "INVOICE" && !user.business.allowInvoicePay) return { ok: false, error: "payment_not_allowed" };

  const [cart, settings] = await Promise.all([getCartDetail(user, ctx, shipping), getSettings()]);
  if (!cart || cart.items.length === 0) return { ok: false, error: "cart_empty" };
  if (cart.hasUnavailable || cart.hasQuoteOnly) return { ok: false, error: "cart_changed" };
  if (cart.warnings.some((w) => w.type === "stock")) return { ok: false, error: "stock" };
  if (cart.items.some((l) => l.unit.hidden)) return { ok: false, error: "cart_changed" };
  const netSubtotal = cart.totals.subtotal - cart.totals.discountTotal;
  if (settings.minimumOrderAmount > 0 && netSubtotal < settings.minimumOrderAmount) return { ok: false, error: "minimum_order" };

  const cartRow = await getActiveCart(user);
  if (!cartRow) return { ok: false, error: "cart_empty" };

  // Création + réservation de stock dans une transaction (vérification stricte, jamais de stock négatif sans backorder).
  let created: { id: string; number: string };
  try {
    created = await db.$transaction(async (tx) => {
      for (const line of cart.items) {
        const inv = await tx.inventory.findUnique({ where: { variantId: line.variantId } });
        const available = inv ? inv.quantity - inv.reserved : 0;
        if (!inv?.allowBackorder && line.quantity > available) throw new Error(`STOCK:${line.name}`);
        if (inv) {
          await tx.inventory.update({ where: { variantId: line.variantId }, data: { quantity: { decrement: line.quantity } } });
          await tx.stockMovement.create({ data: { variantId: line.variantId, type: "SALE", quantity: -line.quantity, referenceType: "order", userId: user.id } });
        }
      }
      const number = await nextNumber(tx, "KY");
      const order = await tx.order.create({
        data: {
          number,
          businessId: user.business.id,
          userId: user.id,
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: input.paymentMethod,
          currency: settings.currency,
          subtotal: cart.totals.subtotal,
          discountTotal: cart.totals.discountTotal,
          shippingTotal: cart.totals.shippingTotal,
          taxTotal: cart.totals.taxTotal,
          total: cart.totals.total,
          savingsTotal: cart.totals.savingsTotal,
          couponCode: cart.totals.discounts.find((d) => d.isCoupon)?.code ?? null,
          poReference: input.poReference || null,
          notes: input.notes || null,
          deliveryInstructions: input.deliveryInstructions || null,
          shippingMethodCode: shipping.code,
          shippingMethodName: shipping.name,
          billingAddress: input.billingAddress as unknown as Prisma.InputJsonValue,
          shippingAddress: input.shippingAddress as unknown as Prisma.InputJsonValue,
          items: {
            create: cart.totals.lines.map((tl) => {
              const line = cart.items.find((l) => l.variantId === tl.variantId)!;
              return {
                productId: line.productId,
                variantId: line.variantId,
                sku: line.sku,
                name: line.name,
                variantName: line.variantName,
                unitLabel: line.unitLabel,
                packagingLabel: line.packagingLabel,
                imageUrl: line.image?.url ?? null,
                quantity: tl.quantity,
                baseUnitPrice: tl.unit.baseUnitPrice,
                unitPrice: tl.unit.unitPrice,
                lineSubtotal: tl.lineSubtotal,
                discountAmount: tl.discountAmount,
                taxRateBps: tl.taxRateBps,
                taxAmount: tl.taxAmount,
                lineTotal: tl.lineTotal,
              };
            }),
          },
          statusHistory: { create: { toStatus: "PENDING", userId: user.id } },
        },
      });
      for (const d of cart.totals.discounts) {
        await tx.promotionUsage.create({ data: { promotionId: d.promotionId, orderId: order.id, businessId: user.business.id, amount: d.amount } });
        await tx.promotion.update({ where: { id: d.promotionId }, data: { usesCount: { increment: 1 } } });
        if (d.isCoupon && d.code) await tx.coupon.update({ where: { code: d.code }, data: { usesCount: { increment: 1 } } });
      }
      for (const line of cart.items) {
        await tx.product.update({ where: { id: line.productId }, data: { salesCount: { increment: line.quantity } } });
      }
      await tx.cart.update({ where: { id: cartRow.id }, data: { status: "CONVERTED", couponCode: null } });
      return { id: order.id, number: order.number };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("STOCK:")) return { ok: false, error: "stock", detail: message.slice(6) };
    throw error;
  }

  // Paiement (après création, pour tracer la tentative). En cas d'échec carte : commande annulée + stock libéré.
  const provider = getPaymentProvider(input.paymentMethod);
  const outcome = await provider.process({ orderId: created.id, orderNumber: created.number, amount: cart.totals.total, currency: settings.currency, customerEmail: user.email, payload: input.paymentPayload });
  await db.payment.create({
    data: {
      orderId: created.id,
      method: input.paymentMethod,
      provider: provider.code,
      providerRef: outcome.providerRef,
      status: outcome.status === "paid" ? "PAID" : outcome.status === "authorized" ? "AUTHORIZED" : outcome.status === "failed" ? "FAILED" : "PENDING",
      amount: cart.totals.total,
      currency: settings.currency,
      paidAt: outcome.status === "paid" ? new Date() : null,
      failureCode: outcome.status === "failed" ? outcome.code : null,
    },
  });
  if (outcome.status === "failed") {
    await cancelOrder(created.id, user.id, `Paiement échoué (${outcome.code})`, "FAILED");
    return { ok: false, error: "payment_failed", detail: outcome.code };
  }
  await db.order.update({
    where: { id: created.id },
    data: {
      paymentStatus: outcome.status === "paid" ? "PAID" : outcome.status === "authorized" ? "AUTHORIZED" : "PENDING",
      status: outcome.status === "paid" || input.paymentMethod === "INVOICE" ? "CONFIRMED" : "PENDING",
      confirmedAt: outcome.status === "paid" || input.paymentMethod === "INVOICE" ? new Date() : null,
      ...(outcome.status === "paid" || input.paymentMethod === "INVOICE" ? { statusHistory: { create: { fromStatus: "PENDING", toStatus: "CONFIRMED", userId: user.id } } } : {}),
    },
  });
  if (input.paymentMethod === "INVOICE") await issueInvoice(created.id);

  const emailData = await orderEmailData(created.id);
  if (emailData) await sendEmail(orderConfirmationEmail(emailData));
  await db.notification.create({ data: { userId: user.id, type: "ORDER", title: `Commande ${created.number} enregistrée`, href: `/account/orders/${created.id}` } });
  return { ok: true, orderId: created.id, number: created.number };
}

async function orderEmailData(orderId: string): Promise<OrderEmailData | null> {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true, user: true, business: true, shipments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!order) return null;
  const email = order.user?.email ?? order.business.email;
  if (!email) return null;
  return {
    firstName: order.user?.firstName ?? order.business.name,
    email,
    number: order.number,
    id: order.id,
    total: order.total,
    paymentMethod: order.paymentMethod,
    invoiceTermDays: order.business.invoiceTermDays,
    items: order.items.map((i) => ({ name: i.variantName ? `${i.name} — ${i.variantName}` : i.name, quantity: i.quantity, lineTotal: i.lineTotal })),
    shippingAddress: formatAddress(order.shippingAddress as unknown as AddressSnapshot),
    tracking: order.shipments[0]?.trackingNumber ?? null,
    trackingUrl: order.shipments[0]?.trackingUrl ?? null,
  };
}

/** Annule une commande et libère le stock. */
export async function cancelOrder(orderId: string, userId: string | null, note: string | null, paymentStatus: "CANCELLED" | "FAILED" | "REFUNDED" = "CANCELLED") {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    if (order.status === "CANCELLED") return;
    for (const item of order.items) {
      if (!item.variantId) continue;
      await tx.inventory.updateMany({ where: { variantId: item.variantId }, data: { quantity: { increment: item.quantity } } });
      await tx.stockMovement.create({ data: { variantId: item.variantId, type: "RELEASE", quantity: item.quantity, referenceType: "order", referenceId: order.id, userId } });
      if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { salesCount: { decrement: item.quantity } } });
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED", paymentStatus, cancelledAt: new Date(), statusHistory: { create: { fromStatus: order.status, toStatus: "CANCELLED", userId, note } } } });
  });
}

export const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

/** Changement de statut (admin) avec historique, emails et effets de bord. */
export async function transitionOrder(orderId: string, toStatus: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED", actorId: string, note?: string | null): Promise<{ ok: boolean; error?: string }> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "not_found" };
  if (!ORDER_TRANSITIONS[order.status]?.includes(toStatus)) return { ok: false, error: "invalid_transition" };
  if (toStatus === "CANCELLED") {
    await cancelOrder(orderId, actorId, note ?? null);
  } else {
    await db.order.update({
      where: { id: orderId },
      data: {
        status: toStatus,
        ...(toStatus === "CONFIRMED" ? { confirmedAt: new Date() } : {}),
        ...(toStatus === "SHIPPED" ? { shippedAt: new Date() } : {}),
        ...(toStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        ...(toStatus === "REFUNDED" ? { paymentStatus: "REFUNDED" } : {}),
        statusHistory: { create: { fromStatus: order.status, toStatus, userId: actorId, note: note ?? null } },
      },
    });
  }
  await db.auditLog.create({ data: { userId: actorId, action: "order.status", entityType: "Order", entityId: orderId, before: { status: order.status }, after: { status: toStatus, note } } });
  const data = await orderEmailData(orderId);
  if (data && toStatus === "SHIPPED") await sendEmail(orderShippedEmail(data));
  if (data && toStatus === "DELIVERED") await sendEmail(orderDeliveredEmail(data));
  if (order.userId) await db.notification.create({ data: { userId: order.userId, type: "ORDER", title: `Commande ${order.number} : ${toStatus.toLowerCase()}`, href: `/account/orders/${orderId}` } });
  return { ok: true };
}

export async function markOrderPaid(orderId: string, actorId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID", ...(order.status === "PENDING" ? { status: "CONFIRMED", confirmedAt: new Date(), statusHistory: { create: { fromStatus: "PENDING", toStatus: "CONFIRMED", userId: actorId } } } : {}) } });
    await tx.payment.updateMany({ where: { orderId, status: { in: ["PENDING", "AUTHORIZED"] } }, data: { status: "PAID", paidAt: new Date() } });
    await tx.invoice.updateMany({ where: { orderId }, data: { status: "PAID", paidAt: new Date() } });
    await tx.auditLog.create({ data: { userId: actorId, action: "order.paid", entityType: "Order", entityId: orderId } });
  });
}

/** Génère la facture d'une commande (numérotée, échéance selon conditions du compte). */
export async function issueInvoice(orderId: string) {
  const existing = await db.invoice.findUnique({ where: { orderId } });
  if (existing) return existing;
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { business: true, user: true } });
  const invoice = await db.$transaction(async (tx) => {
    const number = await nextNumber(tx, "FA");
    const dueDays = order.paymentMethod === "INVOICE" ? order.business.invoiceTermDays : 0;
    return tx.invoice.create({
      data: { number, orderId, businessId: order.businessId, total: order.total, status: order.paymentStatus === "PAID" ? "PAID" : "ISSUED", dueAt: new Date(Date.now() + dueDays * 86_400_000), paidAt: order.paymentStatus === "PAID" ? new Date() : null },
    });
  });
  const email = order.user?.email ?? order.business.email;
  if (email) await sendEmail(invoiceAvailableEmail({ firstName: order.user?.firstName ?? order.business.name, email, number: invoice.number, order: order.number, orderId }));
  return invoice;
}

export async function addShipment(orderId: string, actorId: string, input: { carrier?: string | null; trackingNumber?: string | null; trackingUrl?: string | null }) {
  const shipment = await db.shipment.create({ data: { orderId, carrier: input.carrier || null, trackingNumber: input.trackingNumber || null, trackingUrl: input.trackingUrl || null, status: "SHIPPED", shippedAt: new Date() } });
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (["CONFIRMED", "PROCESSING"].includes(order.status)) {
    if (order.status === "CONFIRMED") await db.order.update({ where: { id: orderId }, data: { status: "PROCESSING", statusHistory: { create: { fromStatus: "CONFIRMED", toStatus: "PROCESSING", userId: actorId } } } });
    await transitionOrder(orderId, "SHIPPED", actorId, input.trackingNumber ? `Suivi ${input.trackingNumber}` : null);
  }
  return shipment;
}

export interface ReorderResult {
  added: { name: string; quantity: number }[];
  unavailable: string[];
  priceChanged: { name: string; old: number; new: number }[];
  moqChanged: { name: string; quantity: number; min: number }[];
}

/** Recommander : ajoute au panier les produits encore disponibles, en signalant les changements. */
export async function reorder(user: CurrentUser, ctx: PricingContext, orderId: string): Promise<ReorderResult | null> {
  const order = await db.order.findFirst({ where: { id: orderId, businessId: user.business?.id ?? "__none__" }, include: { items: true } });
  if (!order) return null;
  const { addToCart } = await import("@/services/cart");
  const result: ReorderResult = { added: [], unavailable: [], priceChanged: [], moqChanged: [] };
  for (const item of order.items) {
    if (!item.variantId) {
      result.unavailable.push(item.name);
      continue;
    }
    const variant = await db.productVariant.findFirst({ where: { id: item.variantId, isActive: true, product: { status: "ACTIVE" } } });
    if (!variant) {
      result.unavailable.push(item.name);
      continue;
    }
    const quantity = normalizeQuantity(item.quantity, variant.moq, variant.orderMultiple);
    if (quantity !== item.quantity) result.moqChanged.push({ name: item.name, quantity, min: variant.moq });
    const res = await addToCart(user, ctx, variant.id, quantity);
    if (!res.ok) {
      result.unavailable.push(item.name);
      continue;
    }
    result.added.push({ name: item.name, quantity: res.quantity });
    const cartItem = await db.cartItem.findUnique({ where: { id: res.itemId } });
    if (cartItem && cartItem.unitPriceAtAdd !== item.unitPrice) result.priceChanged.push({ name: item.name, old: item.unitPrice, new: cartItem.unitPriceAtAdd });
  }
  return result;
}

export async function listBusinessOrders(businessId: string, opts: { status?: string; q?: string; take?: number } = {}) {
  return db.order.findMany({
    where: {
      businessId,
      ...(opts.status ? { status: opts.status as "PENDING" } : {}),
      ...(opts.q ? { OR: [{ number: { contains: opts.q, mode: "insensitive" } }, { poReference: { contains: opts.q, mode: "insensitive" } }, { items: { some: { sku: { contains: opts.q, mode: "insensitive" } } } }] } : {}),
    },
    orderBy: { placedAt: "desc" },
    take: opts.take ?? 50,
    include: { _count: { select: { items: true } }, shipments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
}

export async function getBusinessOrder(businessId: string, id: string) {
  return db.order.findFirst({
    where: { id, businessId },
    include: { items: { include: { product: { select: { slug: true, status: true } } } }, payments: { orderBy: { createdAt: "desc" } }, shipments: { orderBy: { createdAt: "desc" } }, statusHistory: { orderBy: { createdAt: "asc" } }, invoice: true, orderNotes: { where: { isInternal: false }, orderBy: { createdAt: "asc" } } },
  });
}
