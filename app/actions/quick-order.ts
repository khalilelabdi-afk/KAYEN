"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/i18n/server";
import { getCurrentUser, getPricingContext, type ActionResult } from "@/lib/auth/dal";
import { quickOrderSchema } from "@/lib/validation/cart";
import { db } from "@/lib/db";
import { addToCart } from "@/services/cart";
import { normalizeQuantity } from "@/lib/pricing/quantity";

export interface QuickOrderLineResult {
  sku: string;
  status: "added" | "not_found" | "adjusted" | "error";
  name?: string;
  quantity?: number;
  message?: string;
}

export async function quickOrderAction(input: { lines: { sku: string; quantity: number }[] }): Promise<ActionResult<{ results: QuickOrderLineResult[]; added: number }>> {
  const t = await getT();
  const parsed = quickOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("account.quickOrder.empty") };
  const [user, ctx] = await Promise.all([getCurrentUser(), getPricingContext()]);
  const results: QuickOrderLineResult[] = [];
  let added = 0;
  for (const line of parsed.data.lines) {
    const variant = await db.productVariant.findFirst({ where: { sku: { equals: line.sku, mode: "insensitive" }, isActive: true, product: { status: "ACTIVE" } }, include: { product: { select: { name: true } } } });
    if (!variant) {
      results.push({ sku: line.sku, status: "not_found", message: t("account.quickOrder.notFound", { sku: line.sku }) });
      continue;
    }
    const quantity = normalizeQuantity(line.quantity, variant.moq, variant.orderMultiple);
    const res = await addToCart(user, ctx, variant.id, quantity);
    if (!res.ok) {
      results.push({ sku: variant.sku, name: variant.product.name, status: "error", message: res.error === "out_of_stock" ? t("common.errors.outOfStock", { available: res.available ?? 0 }) : t("common.errors.productUnavailable") });
      continue;
    }
    added += 1;
    results.push({ sku: variant.sku, name: variant.product.name, quantity: res.quantity, status: quantity !== line.quantity ? "adjusted" : "added", message: quantity !== line.quantity ? t("account.quickOrder.adjusted", { sku: variant.sku, quantity }) : undefined });
  }
  revalidatePath("/", "layout");
  return { ok: true, data: { results, added }, message: t("account.quickOrder.added", { count: added }) };
}
