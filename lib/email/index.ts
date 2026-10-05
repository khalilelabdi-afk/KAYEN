import "server-only";
import { db } from "@/lib/db";

/**
 * Envoi d'emails transactionnels. Providers : "log" (console + table EmailOutbox), "resend" (API HTTP).
 * Les templates vivent dans /emails et retournent { subject, html, text }.
 */
export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  template: string;
  replyTo?: string;
}

type Provider = "log" | "resend";

function getProvider(): Provider {
  const p = process.env.EMAIL_PROVIDER;
  return p === "resend" && process.env.RESEND_API_KEY ? "resend" : "log";
}

async function sendViaResend(message: EmailMessage): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "KAYEN <no-reply@kayen.com>",
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
    }),
  });
  if (!res.ok) throw new Error(`Resend: ${res.status} ${await res.text()}`);
}

/** Envoie un email ; ne lève jamais (journalise l'échec) afin de ne pas casser un parcours utilisateur. */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const to = Array.isArray(message.to) ? message.to.join(", ") : message.to;
  const outbox = await db.emailOutbox.create({ data: { to, subject: message.subject, template: message.template } }).catch(() => null);
  try {
    if (getProvider() === "resend") {
      await sendViaResend(message);
    } else {
      console.info(`[email:log] → ${to} | ${message.subject}\n${message.text.slice(0, 400)}${message.text.length > 400 ? "…" : ""}`);
    }
    if (outbox) await db.emailOutbox.update({ where: { id: outbox.id }, data: { status: "SENT", sentAt: new Date() } }).catch(() => undefined);
    return true;
  } catch (error) {
    console.error("[email] échec d'envoi", error);
    if (outbox) await db.emailOutbox.update({ where: { id: outbox.id }, data: { status: "FAILED", error: String(error).slice(0, 500) } }).catch(() => undefined);
    return false;
  }
}
