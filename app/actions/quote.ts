"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getT } from "@/i18n/server";
import { getCurrentUser, getPricingContext } from "@/lib/auth/dal";
import { rateLimit } from "@/lib/auth/rate-limit";
import { fieldErrors } from "@/lib/validation/common";
import { quoteRequestSchema } from "@/lib/validation/quote";
import { createQuoteRequest } from "@/services/quotes";
import { storeUpload } from "@/lib/storage";

export type QuoteFormState = { error?: string; fieldErrors?: Record<string, string[]>; values?: Record<string, string> } | undefined;

export async function submitQuoteAction(_prev: QuoteFormState, formData: FormData): Promise<QuoteFormState> {
  const t = await getT();
  const raw: Record<string, unknown> = {};
  const items: { variantId?: string; sku?: string; name?: string; quantity: unknown }[] = [];
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    const m = /^items\[(\d+)\]\.(variantId|sku|name|quantity)$/.exec(key);
    if (m) {
      const idx = Number(m[1]);
      items[idx] = { ...(items[idx] ?? { quantity: 1 }), [m[2]]: value };
    } else raw[key] = value;
  }
  raw.items = items.filter(Boolean);
  const values: Record<string, string> = {};
  for (const k of ["companyName", "contactName", "email", "phone", "desiredDate", "message"]) if (typeof raw[k] === "string") values[k] = raw[k] as string;

  const parsed = quoteRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = fieldErrors(parsed.error);
    const mapped: Record<string, string[]> = {};
    for (const [k, msgs] of Object.entries(fe)) mapped[k] = msgs.map((m) => (m === "consent_required" ? t("common.errors.required") : k === "email" ? t("common.errors.invalidEmail") : k === "phone" ? t("common.errors.invalidPhone") : t("common.errors.required")));
    return { error: t("common.errors.validation"), fieldErrors: mapped, values };
  }
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "local").split(",")[0]?.trim() ?? "local";
  const limit = await rateLimit(`quote:${ip}`, 10, 60 * 60);
  if (!limit.ok) return { error: t("common.errors.rateLimited"), values };

  let attachmentUrl: string | null = null;
  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) return { error: t("quote.form.attachmentHint"), values };
    attachmentUrl = await storeUpload(file, "quotes");
  }

  const [user, ctx] = await Promise.all([getCurrentUser(), getPricingContext()]);
  const quote = await createQuoteRequest(parsed.data, user, ctx, attachmentUrl);
  redirect(`/quote/success?number=${encodeURIComponent(quote.number)}`);
}
