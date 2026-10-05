import "server-only";
import { db } from "@/lib/db";
import type { QuoteRequestInput } from "@/lib/validation/quote";
import type { CurrentUser } from "@/lib/auth/dal";
import type { PricingContext } from "@/lib/pricing/types";
import { calculateUnitPrice } from "@/lib/pricing/engine";
import { buildPricingInput, getActivePromotions, variantPricingInclude } from "@/services/pricing";
import { getCartDetail } from "@/services/cart";
import { sendEmail } from "@/lib/email";
import { quoteReceivedEmail, newQuoteAdminEmail } from "@/emails";
import { getSettings } from "@/services/settings";
import { nextNumber } from "./numbering";

export async function createQuoteRequest(input: QuoteRequestInput, user: CurrentUser | null, ctx: PricingContext, attachmentUrl: string | null) {
  const promotions = await getActivePromotions();
  const items: { variantId: string | null; sku: string; name: string; quantity: number; referenceUnitPrice: number | null }[] = [];

  if (input.source === "CART") {
    const cart = await getCartDetail(user, ctx);
    for (const line of cart?.items ?? []) {
      if (line.unavailable) continue;
      items.push({ variantId: line.variantId, sku: line.sku, name: line.variantName ? `${line.name} — ${line.variantName}` : line.name, quantity: line.quantity, referenceUnitPrice: line.unit.hidden ? null : line.unit.unitPrice });
    }
  }
  for (const it of input.items) {
    const sku = it.sku?.trim();
    const variant = it.variantId
      ? await db.productVariant.findFirst({ where: { id: it.variantId }, include: { ...variantPricingInclude(ctx), product: { select: { id: true, name: true, categoryId: true, brandId: true, requiresAccount: true, taxClass: { select: { rateBps: true } } } } } })
      : sku
        ? await db.productVariant.findFirst({ where: { sku: { equals: sku, mode: "insensitive" } }, include: { ...variantPricingInclude(ctx), product: { select: { id: true, name: true, categoryId: true, brandId: true, requiresAccount: true, taxClass: { select: { rateBps: true } } } } } })
        : null;
    if (variant) {
      const price = calculateUnitPrice(await buildPricingInput(variant), it.quantity, ctx, promotions);
      items.push({ variantId: variant.id, sku: variant.sku, name: variant.name ? `${variant.product.name} — ${variant.name}` : variant.product.name, quantity: it.quantity, referenceUnitPrice: price.hidden ? null : price.unitPrice });
    } else if (sku || it.name) {
      items.push({ variantId: null, sku: sku || "—", name: it.name || sku || "—", quantity: it.quantity, referenceUnitPrice: null });
    }
  }

  const quote = await db.$transaction(async (tx) => {
    const number = await nextNumber(tx, "DV");
    const created = await tx.quote.create({
      data: {
        number,
        businessId: user?.business?.id ?? null,
        userId: user?.id ?? null,
        source: input.source,
        companyName: input.companyName,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone || null,
        message: input.message || null,
        desiredDate: input.desiredDate ? new Date(input.desiredDate) : null,
        attachmentUrl,
        items: { create: items },
      },
    });
    if (input.source === "CART" && user) {
      await tx.cart.updateMany({ where: { userId: user.id, status: "ACTIVE" }, data: { status: "QUOTED" } });
    }
    return created;
  });

  const settings = await getSettings();
  await Promise.all([
    sendEmail(quoteReceivedEmail({ firstName: input.contactName.split(" ")[0] ?? input.contactName, email: input.email, number: quote.number })),
    sendEmail(newQuoteAdminEmail({ company: input.companyName, number: quote.number, id: quote.id, to: settings.salesEmail })),
  ]);
  if (user) {
    await db.notification.create({ data: { userId: user.id, type: "QUOTE", title: `Devis ${quote.number} envoyé`, href: `/account/quotes/${quote.id}` } });
  }
  return quote;
}

export async function listBusinessQuotes(businessId: string) {
  return db.quote.findMany({ where: { businessId }, orderBy: { createdAt: "desc" }, include: { _count: { select: { items: true } } } });
}

export async function getBusinessQuote(businessId: string, id: string) {
  return db.quote.findFirst({ where: { id, businessId }, include: { items: true, order: { select: { id: true, number: true } } } });
}

/** Le client accepte ou refuse un devis envoyé. */
export async function decideQuote(businessId: string, id: string, decision: "ACCEPTED" | "REJECTED", note?: string) {
  const quote = await db.quote.findFirst({ where: { id, businessId, status: "QUOTED" } });
  if (!quote) return null;
  if (quote.validUntil && quote.validUntil < new Date()) {
    await db.quote.update({ where: { id }, data: { status: "EXPIRED" } });
    return null;
  }
  return db.quote.update({ where: { id }, data: { status: decision, decidedAt: new Date(), customerNote: note || null } });
}
