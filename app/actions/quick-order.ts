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

/** Analyse des lignes "SKU;Quantité" (collées ou importées) sans ajouter au panier. */
export function parseQuickOrderText(text: string): { sku: string; quantity: number }[] {
  const lines: { sku: string; quantity: number }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const [sku, qty] = line.split(/[;,\t]|\s{2,}|\s+(?=\d+$)/).map((s) => s?.trim());
    if (!sku || /^sku$/i.test(sku)) continue;
    const quantity = Number.parseInt(qty ?? "1", 10);
    lines.push({ sku, quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1 });
  }
  return lines.slice(0, 500);
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
