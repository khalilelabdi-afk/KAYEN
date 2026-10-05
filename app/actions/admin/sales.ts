"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { requireStaff, type ActionResult } from "@/lib/auth/dal";
import { transitionOrder, markOrderPaid, addShipment, issueInvoice } from "@/services/orders";
import { nextNumber } from "@/services/numbering";
import { sendEmail } from "@/lib/email";
import { quoteReadyEmail, accountApprovedEmail } from "@/emails";
import { getSettings } from "@/services/settings";
import { formatDate } from "@/lib/utils";
import { revokeUserSessions } from "@/lib/auth/session";
import { idSchema, moneySchema, optionalText, quantitySchema } from "@/lib/validation/common";
import { PROMOTIONS_TAG } from "@/services/pricing";
import { revalidateTag } from "next/cache";

async function audit(userId: string, action: string, entityType: string, entityId: string, before?: unknown, after?: unknown) {
  await db.auditLog.create({ data: { userId, action, entityType, entityId, before: before as Prisma.InputJsonValue, after: after as Prisma.InputJsonValue } });
}

// ── Commandes ──────────────────────────────────────────────────────────────
export async function orderStatusAction(input: { orderId: string; status: string; note?: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = z.object({ orderId: idSchema, status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]), note: optionalText(500) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const res = await transitionOrder(parsed.data.orderId, parsed.data.status, user.id, parsed.data.note || null);
  if (!res.ok) return { ok: false, error: t("common.errors.generic") };
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true, message: t("admin.orders.detail.statusUpdated") };
}

export async function orderNoteAction(input: { orderId: string; content: string; isInternal?: boolean }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const content = input.content.trim().slice(0, 2000);
  if (!content) return { ok: false, error: t("common.errors.required") };
  await db.orderNote.create({ data: { orderId: input.orderId, userId: user.id, content, isInternal: input.isInternal ?? true } });
  revalidatePath(`/admin/orders/${input.orderId}`);
  return { ok: true, message: t("admin.orders.detail.noteAdded") };
}

export async function orderMarkPaidAction(input: { orderId: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  await markOrderPaid(input.orderId, user.id);
  revalidatePath(`/admin/orders/${input.orderId}`);
  return { ok: true, message: t("admin.orders.detail.statusUpdated") };
}

export async function orderShipmentAction(input: { orderId: string; carrier?: string; trackingNumber?: string; trackingUrl?: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = z.object({ orderId: idSchema, carrier: optionalText(80), trackingNumber: optionalText(80), trackingUrl: z.string().url().max(500).optional().or(z.literal("")) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  await addShipment(parsed.data.orderId, user.id, parsed.data);
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return { ok: true, message: t("admin.orders.detail.shipmentAdded") };
}

export async function orderInvoiceAction(input: { orderId: string }): Promise<ActionResult> {
  const t = await getT();
  await requireStaff();
  await issueInvoice(input.orderId);
  revalidatePath(`/admin/orders/${input.orderId}`);
  return { ok: true, message: t("common.toasts.saved") };
}

// ── Devis ──────────────────────────────────────────────────────────────────
export async function quoteStatusAction(input: { quoteId: string; status: "IN_REVIEW" | "REJECTED" | "EXPIRED"; adminNotes?: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const before = await db.quote.findUnique({ where: { id: input.quoteId } });
  if (!before) return { ok: false, error: t("common.errors.notFound") };
  await db.quote.update({ where: { id: input.quoteId }, data: { status: input.status, adminNotes: input.adminNotes?.slice(0, 2000) ?? before.adminNotes, ...(input.status === "REJECTED" ? { decidedAt: new Date() } : {}) } });
  await audit(user.id, "quote.status", "Quote", input.quoteId, { status: before.status }, { status: input.status });
  revalidatePath(`/admin/quotes/${input.quoteId}`);
  revalidatePath("/admin/quotes");
  return { ok: true, message: t("common.toasts.saved") };
}

const sendQuoteSchema = z.object({
  quoteId: idSchema,
  validUntil: z.string().min(8).max(10),
  customerNote: optionalText(2000),
  adminNotes: optionalText(2000),
  items: z.array(z.object({ id: idSchema, quotedUnitPrice: moneySchema, quantity: quantitySchema })).min(1),
});

/** Envoie la proposition au client (prix par ligne, validité, message). */
export async function sendQuoteAction(input: z.infer<typeof sendQuoteSchema>): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = sendQuoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const quote = await db.quote.findUnique({ where: { id: parsed.data.quoteId }, include: { user: true } });
  if (!quote) return { ok: false, error: t("common.errors.notFound") };
  let total = 0;
  await db.$transaction(async (tx) => {
    for (const it of parsed.data.items) {
      await tx.quoteItem.updateMany({ where: { id: it.id, quoteId: quote.id }, data: { quotedUnitPrice: it.quotedUnitPrice, quantity: it.quantity } });
      total += it.quotedUnitPrice * it.quantity;
    }
    await tx.quote.update({ where: { id: quote.id }, data: { status: "QUOTED", quotedTotal: total, validUntil: new Date(parsed.data.validUntil), customerNote: parsed.data.customerNote || null, adminNotes: parsed.data.adminNotes || null, respondedAt: new Date() } });
  });
  await audit(user.id, "quote.sent", "Quote", quote.id, null, { total, validUntil: parsed.data.validUntil });
  await sendEmail(quoteReadyEmail({ firstName: quote.user?.firstName ?? quote.contactName, email: quote.email, number: quote.number, id: quote.id, total, validUntil: formatDate(new Date(parsed.data.validUntil)) }));
  if (quote.userId) await db.notification.create({ data: { userId: quote.userId, type: "QUOTE", title: `Devis ${quote.number} disponible`, href: `/account/quotes/${quote.id}` } });
  revalidatePath(`/admin/quotes/${quote.id}`);
  revalidatePath("/admin/quotes");
  return { ok: true, message: t("admin.quotes.detail.sent") };
}

/** Transforme un devis accepté en commande (prix proposés, stock réservé, paiement sur facture ou virement). */
export async function convertQuoteAction(input: { quoteId: string; addressId: string; shippingMethodCode: string; paymentMethod: "BANK_TRANSFER" | "INVOICE" }): Promise<ActionResult<{ orderId: string; number: string }>> {
  const t = await getT();
  const user = await requireStaff();
  const quote = await db.quote.findUnique({ where: { id: input.quoteId }, include: { items: { include: { variant: { include: { product: { select: { id: true, name: true, taxClass: { select: { rateBps: true } } } }, inventory: true } } } }, business: true, user: true } });
  if (!quote || !quote.business) return { ok: false, error: t("common.errors.notFound") };
  if (!["ACCEPTED", "QUOTED"].includes(quote.status)) return { ok: false, error: t("common.errors.forbidden") };
  const address = await db.address.findFirst({ where: { id: input.addressId, businessId: quote.business.id } });
  const method = await db.shippingMethod.findUnique({ where: { code: input.shippingMethodCode } });
  if (!address || !method) return { ok: false, error: t("common.errors.validation") };
  const settings = await getSettings();
  const defaultTax = (await db.taxClass.findFirst({ where: { isDefault: true } }))?.rateBps ?? 2000;
  const snapshot = { label: address.label, company: address.company, firstName: address.firstName, lastName: address.lastName, line1: address.line1, line2: address.line2, postalCode: address.postalCode, city: address.city, region: address.region, countryCode: address.countryCode, phone: address.phone, instructions: address.instructions };

  const order = await db.$transaction(async (tx) => {
    let subtotal = 0, taxTotal = 0;
    const items: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    for (const it of quote.items) {
      const unitPrice = it.quotedUnitPrice ?? it.referenceUnitPrice ?? 0;
      const taxRateBps = it.variant?.product.taxClass?.rateBps ?? defaultTax;
      const lineSubtotal = unitPrice * it.quantity;
      const taxAmount = Math.round((lineSubtotal * taxRateBps) / 10_000);
      subtotal += lineSubtotal;
      taxTotal += taxAmount;
      if (it.variant?.inventory) {
        await tx.inventory.update({ where: { variantId: it.variant.id }, data: { quantity: { decrement: it.quantity } } });
        await tx.stockMovement.create({ data: { variantId: it.variant.id, type: "SALE", quantity: -it.quantity, referenceType: "quote", referenceId: quote.id, userId: user.id } });
      }
      items.push({ product: it.variant ? { connect: { id: it.variant.product.id } } : undefined, variant: it.variant ? { connect: { id: it.variant.id } } : undefined, sku: it.sku, name: it.name, unitLabel: it.variant?.unitLabel ?? "unité", packagingLabel: it.variant?.packagingLabel ?? null, quantity: it.quantity, baseUnitPrice: it.referenceUnitPrice ?? unitPrice, unitPrice, lineSubtotal, discountAmount: 0, taxRateBps, taxAmount, lineTotal: lineSubtotal + taxAmount });
    }
    const shippingTotal = method.freeAbove !== null && subtotal >= method.freeAbove ? 0 : method.price;
    const shippingTax = Math.round((shippingTotal * defaultTax) / 10_000);
    const number = await nextNumber(tx, "KY");
    const created = await tx.order.create({
      data: {
        number, businessId: quote.business!.id, userId: quote.userId, status: "CONFIRMED", paymentStatus: "PENDING", paymentMethod: input.paymentMethod, currency: settings.currency,
        subtotal, discountTotal: 0, shippingTotal, taxTotal: taxTotal + shippingTax, total: subtotal + shippingTotal + taxTotal + shippingTax, savingsTotal: Math.max(0, quote.items.reduce((s, i) => s + ((i.referenceUnitPrice ?? 0) - (i.quotedUnitPrice ?? i.referenceUnitPrice ?? 0)) * i.quantity, 0)),
        shippingMethodCode: method.code, shippingMethodName: method.name, billingAddress: snapshot as unknown as Prisma.InputJsonValue, shippingAddress: snapshot as unknown as Prisma.InputJsonValue, quoteId: quote.id, confirmedAt: new Date(),
        items: { create: items }, statusHistory: { create: [{ toStatus: "PENDING", userId: user.id, note: `Devis ${quote.number}` }, { fromStatus: "PENDING", toStatus: "CONFIRMED", userId: user.id }] },
        payments: { create: { method: input.paymentMethod, provider: input.paymentMethod === "INVOICE" ? "invoice" : "bank_transfer", status: "PENDING", amount: subtotal + shippingTotal + taxTotal + shippingTax, currency: settings.currency } },
      },
    });
    await tx.quote.update({ where: { id: quote.id }, data: { status: "CONVERTED" } });
    return created;
  });
  if (input.paymentMethod === "INVOICE") await issueInvoice(order.id);
  await audit(user.id, "quote.convert", "Quote", quote.id, null, { orderId: order.id, number: order.number });
  if (quote.userId) await db.notification.create({ data: { userId: quote.userId, type: "ORDER", title: `Commande ${order.number} créée depuis le devis ${quote.number}`, href: `/account/orders/${order.id}` } });
  revalidatePath(`/admin/quotes/${quote.id}`);
  revalidatePath("/admin/orders");
  return { ok: true, data: { orderId: order.id, number: order.number }, message: t("admin.quotes.detail.converted", { number: order.number }) };
}

// ── Clients ────────────────────────────────────────────────────────────────
export async function businessStatusAction(input: { businessId: string; status: "VERIFIED" | "APPROVED" | "REJECTED" | "SUSPENDED" }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const business = await db.business.findUnique({ where: { id: input.businessId }, include: { members: { where: { role: "OWNER" }, include: { user: true } } } });
  if (!business) return { ok: false, error: t("common.errors.notFound") };
  await db.business.update({ where: { id: business.id }, data: { status: input.status, ...(input.status === "APPROVED" ? { approvedAt: new Date() } : {}) } });
  await audit(user.id, "business.status", "Business", business.id, { status: business.status }, { status: input.status });
  if (input.status === "SUSPENDED") for (const m of business.members) await revokeUserSessions(m.userId);
  if (input.status === "APPROVED" && business.status !== "APPROVED") {
    const owner = business.members[0]?.user;
    if (owner) {
      await sendEmail(accountApprovedEmail({ firstName: owner.firstName, email: owner.email, company: business.name }));
      await db.notification.create({ data: { userId: owner.id, type: "ACCOUNT", title: "Votre compte professionnel est validé", href: "/account" } });
    }
  }
  revalidatePath(`/admin/customers/${business.id}`);
  revalidatePath("/admin/customers");
  return { ok: true, message: t("admin.customers.detail.statusUpdated") };
}

export async function businessUpdateAction(input: { businessId: string; customerGroupId?: string | null; allowInvoicePay?: boolean; invoiceTermDays?: number; creditLimit?: number | null; internalNotes?: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = z.object({ businessId: idSchema, customerGroupId: z.string().max(64).nullable().optional(), allowInvoicePay: z.boolean().optional(), invoiceTermDays: z.coerce.number().int().min(0).max(180).optional(), creditLimit: z.coerce.number().int().min(0).nullable().optional(), internalNotes: optionalText(4000) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const { businessId, ...data } = parsed.data;
  const before = await db.business.findUnique({ where: { id: businessId } });
  await db.business.update({ where: { id: businessId }, data: { ...data, customerGroupId: data.customerGroupId === "" ? null : data.customerGroupId, internalNotes: data.internalNotes || null } });
  await audit(user.id, "business.update", "Business", businessId, { customerGroupId: before?.customerGroupId, allowInvoicePay: before?.allowInvoicePay }, data);
  revalidatePath(`/admin/customers/${businessId}`);
  return { ok: true, message: t("admin.customers.detail.saved") };
}

export async function customerPriceAction(input: { businessId: string; sku: string; minQuantity: number; unitPrice: number }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = z.object({ businessId: idSchema, sku: z.string().trim().min(1), minQuantity: quantitySchema, unitPrice: moneySchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const variant = await db.productVariant.findFirst({ where: { sku: { equals: parsed.data.sku, mode: "insensitive" } } });
  if (!variant) return { ok: false, error: t("account.quickOrder.notFound", { sku: parsed.data.sku }) };
  const existing = await db.customerPrice.findFirst({ where: { variantId: variant.id, businessId: parsed.data.businessId, minQuantity: parsed.data.minQuantity } });
  if (existing) await db.customerPrice.update({ where: { id: existing.id }, data: { unitPrice: parsed.data.unitPrice } });
  else await db.customerPrice.create({ data: { variantId: variant.id, businessId: parsed.data.businessId, minQuantity: parsed.data.minQuantity, unitPrice: parsed.data.unitPrice } });
  await audit(user.id, "price.customer", "CustomerPrice", variant.id, existing ? { unitPrice: existing.unitPrice } : null, { sku: variant.sku, unitPrice: parsed.data.unitPrice, minQuantity: parsed.data.minQuantity });
  revalidatePath(`/admin/customers/${parsed.data.businessId}`);
  return { ok: true, message: t("common.toasts.saved") };
}

export async function deleteCustomerPriceAction(input: { id: string }): Promise<ActionResult> {
  const user = await requireStaff();
  const row = await db.customerPrice.findUnique({ where: { id: input.id } });
  if (!row) return { ok: true };
  await db.customerPrice.delete({ where: { id: row.id } });
  await audit(user.id, "price.customer.delete", "CustomerPrice", row.id, { unitPrice: row.unitPrice }, null);
  if (row.businessId) revalidatePath(`/admin/customers/${row.businessId}`);
  return { ok: true };
}

export async function customerGroupAction(input: { id?: string; code: string; name: string; discountBps: number; isDefault?: boolean; description?: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await requireStaff();
  const parsed = z.object({ id: z.string().optional(), code: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/), name: z.string().trim().min(2).max(80), discountBps: z.coerce.number().int().min(0).max(10000), isDefault: z.boolean().optional(), description: optionalText(300) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const { id, ...data } = parsed.data;
  if (data.isDefault) await db.customerGroup.updateMany({ data: { isDefault: false } });
  const row = id ? await db.customerGroup.update({ where: { id }, data: { ...data, description: data.description || null } }) : await db.customerGroup.create({ data: { ...data, description: data.description || null } });
  await audit(user.id, "customerGroup.save", "CustomerGroup", row.id, null, data);
  revalidateTag(PROMOTIONS_TAG, "max");
  revalidatePath("/admin/customers/groups");
  return { ok: true, message: t("admin.customers.groups.saved") };
}

// ── Messages ───────────────────────────────────────────────────────────────
export async function contactStatusAction(input: { id: string; status: "NEW" | "IN_PROGRESS" | "CLOSED" }): Promise<ActionResult> {
  await requireStaff();
  await db.contactMessage.update({ where: { id: input.id }, data: { status: input.status } });
  revalidatePath("/admin/messages");
  return { ok: true };
}
