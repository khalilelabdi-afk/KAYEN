"use server";

import { headers } from "next/headers";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/auth/rate-limit";
import { contactSchema } from "@/lib/validation/quote";
import { fieldErrors, formDataToObject } from "@/lib/validation/common";
import { sendEmail } from "@/lib/email";
import { getSettings } from "@/services/settings";
import { renderEmail } from "@/emails/layout";

export type ContactState = { error?: string; fieldErrors?: Record<string, string[]>; success?: string; values?: Record<string, string> } | undefined;

export async function contactAction(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const t = await getT();
  const raw = formDataToObject(formData);
  const values: Record<string, string> = {};
  for (const k of ["name", "company", "email", "phone", "subject", "message"]) if (typeof raw[k] === "string") values[k] = raw[k] as string;
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = fieldErrors(parsed.error);
    const mapped: Record<string, string[]> = {};
    for (const [k, msgs] of Object.entries(fe)) mapped[k] = msgs.map(() => (k === "email" ? t("common.errors.invalidEmail") : k === "phone" ? t("common.errors.invalidPhone") : t("common.errors.required")));
    return { error: t("common.errors.validation"), fieldErrors: mapped, values };
  }
  if (parsed.data.website) return { success: t("cms.contact.form.success") }; // honeypot
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "local").split(",")[0]?.trim() ?? "local";
  const limit = await rateLimit(`contact:${ip}`, 5, 60 * 60);
  if (!limit.ok) return { error: t("common.errors.rateLimited"), values };

  const message = await db.contactMessage.create({ data: { name: parsed.data.name, company: parsed.data.company || null, email: parsed.data.email, phone: parsed.data.phone || null, subject: parsed.data.subject, message: parsed.data.message } });
  const settings = await getSettings();
  const subjectLabel = t.enum("cms.contact.form.subjects", parsed.data.subject);
  const rendered = renderEmail({
    title: `Contact : ${subjectLabel}`,
    blocks: [
      { type: "table", rows: [{ label: "Nom", value: parsed.data.name }, { label: "Société", value: parsed.data.company || "—" }, { label: "Email", value: parsed.data.email }, { label: "Téléphone", value: parsed.data.phone || "—" }] },
      { type: "paragraph", text: parsed.data.message },
      { type: "cta", text: "Voir dans l'administration", href: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/messages` },
    ],
  });
  await sendEmail({ to: parsed.data.subject === "sales" || parsed.data.subject === "quote" ? settings.salesEmail : settings.supportEmail, subject: `[Contact] ${subjectLabel} — ${parsed.data.name}`, template: "contact", replyTo: parsed.data.email, ...rendered });
  void message;
  return { success: t("cms.contact.form.success") };
}
