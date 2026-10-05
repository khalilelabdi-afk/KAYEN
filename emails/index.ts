import { getDictionary, interpolate } from "@/i18n";
import { formatMoney } from "@/lib/money";
import { siteConfig } from "@/lib/config/site";
import type { EmailMessage } from "@/lib/email";
import { renderEmail } from "./layout";

const e = getDictionary("fr").emails;
const greet = (name: string) => interpolate(e.common.greeting, { name });
const base = siteConfig.url;

export function welcomeEmail(p: { firstName: string; company: string; email: string }): EmailMessage {
  const r = renderEmail({ title: e.welcome.title, greeting: greet(p.firstName), blocks: [{ type: "paragraph", text: interpolate(e.welcome.body, { company: p.company }) }, { type: "muted", text: e.welcome.pending }, { type: "cta", text: e.welcome.cta, href: `${base}/c` }] });
  return { to: p.email, subject: e.welcome.subject, template: "welcome", ...r };
}

export function verifyEmailEmail(p: { firstName: string; email: string; url: string }): EmailMessage {
  const r = renderEmail({ title: e.verifyEmail.title, greeting: greet(p.firstName), blocks: [{ type: "paragraph", text: e.verifyEmail.body }, { type: "cta", text: e.verifyEmail.cta, href: p.url }] });
  return { to: p.email, subject: e.verifyEmail.subject, template: "verify-email", ...r };
}

export function passwordResetEmail(p: { firstName: string; email: string; url: string }): EmailMessage {
  const r = renderEmail({ title: e.passwordReset.title, greeting: greet(p.firstName), blocks: [{ type: "paragraph", text: e.passwordReset.body }, { type: "cta", text: e.passwordReset.cta, href: p.url }, { type: "muted", text: e.passwordReset.ignore }] });
  return { to: p.email, subject: e.passwordReset.subject, template: "password-reset", ...r };
}

export function accountApprovedEmail(p: { firstName: string; email: string; company: string }): EmailMessage {
  const r = renderEmail({ title: e.accountApproved.title, greeting: greet(p.firstName), blocks: [{ type: "paragraph", text: interpolate(e.accountApproved.body, { company: p.company }) }, { type: "cta", text: e.accountApproved.cta, href: `${base}/c` }] });
  return { to: p.email, subject: e.accountApproved.subject, template: "account-approved", ...r };
}

export function newBusinessAdminEmail(p: { company: string; email: string; to: string }): EmailMessage {
  const r = renderEmail({ title: e.newBusinessAdmin.title, blocks: [{ type: "paragraph", text: interpolate(e.newBusinessAdmin.body, { company: p.company, email: p.email }) }, { type: "cta", text: e.newBusinessAdmin.cta, href: `${base}/admin/customers?status=PENDING` }] });
  return { to: p.to, subject: interpolate(e.newBusinessAdmin.subject, { company: p.company }), template: "new-business-admin", ...r };
}

export function memberInviteEmail(p: { firstName: string; email: string; company: string; inviter: string; url: string }): EmailMessage {
  const r = renderEmail({ title: e.memberInvite.title, greeting: greet(p.firstName), blocks: [{ type: "paragraph", text: interpolate(e.memberInvite.body, { company: p.company, inviter: p.inviter }) }, { type: "cta", text: e.memberInvite.cta, href: p.url }] });
  return { to: p.email, subject: interpolate(e.memberInvite.subject, { company: p.company }), template: "member-invite", ...r };
}

export interface OrderEmailData {
  firstName: string;
  email: string;
  number: string;
  id: string;
  total: number;
  paymentMethod: "CARD" | "BANK_TRANSFER" | "INVOICE";
  invoiceTermDays: number;
  items: { name: string; quantity: number; lineTotal: number }[];
  shippingAddress: string;
  tracking?: string | null;
  trackingUrl?: string | null;
}

export function orderConfirmationEmail(p: OrderEmailData): EmailMessage {
  const blocks = [
    { type: "paragraph" as const, text: interpolate(e.orderConfirmation.body, { number: p.number }) },
    { type: "heading" as const, text: e.orderConfirmation.items },
    { type: "table" as const, rows: [...p.items.map((i) => ({ label: `${i.quantity} × ${i.name}`, value: formatMoney(i.lineTotal) })), { label: e.orderConfirmation.total, value: formatMoney(p.total) }] },
    { type: "muted" as const, text: `${e.orderConfirmation.shippingTo} : ${p.shippingAddress}` },
  ];
  if (p.paymentMethod === "BANK_TRANSFER") blocks.push({ type: "paragraph", text: interpolate(e.orderConfirmation.bankTransfer, { amount: formatMoney(p.total), number: p.number }) });
  if (p.paymentMethod === "INVOICE") blocks.push({ type: "paragraph", text: interpolate(e.orderConfirmation.invoice, { days: p.invoiceTermDays }) });
  const r = renderEmail({ title: e.orderConfirmation.title, greeting: greet(p.firstName), blocks: [...blocks, { type: "cta", text: e.orderConfirmation.cta, href: `${base}/account/orders/${p.id}` }] });
  return { to: p.email, subject: interpolate(e.orderConfirmation.subject, { number: p.number }), template: "order-confirmation", ...r };
}

export function orderShippedEmail(p: OrderEmailData): EmailMessage {
  const r = renderEmail({ title: e.orderShipped.title, greeting: greet(p.firstName), blocks: [{ type: "paragraph", text: interpolate(e.orderShipped.body, { number: p.number }) }, ...(p.tracking ? [{ type: "paragraph" as const, text: interpolate(e.orderShipped.tracking, { tracking: p.tracking }) }] : []), { type: "cta", text: e.orderShipped.cta, href: p.trackingUrl ?? `${base}/account/orders/${p.id}` }] });
  return { to: p.email, subject: interpolate(e.orderShipped.subject, { number: p.number }), template: "order-shipped", ...r };
}

export function orderDeliveredEmail(p: OrderEmailData): EmailMessage {
  const r = renderEmail({ title: e.orderDelivered.title, greeting: greet(p.firstName), blocks: [{ type: "paragraph", text: interpolate(e.orderDelivered.body, { number: p.number }) }, { type: "cta", text: e.orderDelivered.cta, href: `${base}/account/orders/${p.id}` }] });
  return { to: p.email, subject: interpolate(e.orderDelivered.subject, { number: p.number }), template: "order-delivered", ...r };
}

export function quoteReceivedEmail(p: { firstName: string; email: string; number: string }): EmailMessage {
  const r = renderEmail({ title: e.quoteReceived.title, greeting: greet(p.firstName), blocks: [{ type: "paragraph", text: interpolate(e.quoteReceived.body, { number: p.number }) }, { type: "cta", text: e.quoteReceived.cta, href: `${base}/account/quotes` }] });
  return { to: p.email, subject: interpolate(e.quoteReceived.subject, { number: p.number }), template: "quote-received", ...r };
}

export function quoteReadyEmail(p: { firstName: string; email: string; number: string; id: string; total: number | null; validUntil: string }): EmailMessage {
  const r = renderEmail({ title: e.quoteReady.title, greeting: greet(p.firstName), blocks: [{ type: "paragraph", text: interpolate(e.quoteReady.body, { number: p.number, validUntil: p.validUntil }) }, ...(p.total !== null ? [{ type: "paragraph" as const, text: interpolate(e.quoteReady.total, { total: formatMoney(p.total) }) }] : []), { type: "cta", text: e.quoteReady.cta, href: `${base}/account/quotes/${p.id}` }] });
  return { to: p.email, subject: interpolate(e.quoteReady.subject, { number: p.number }), template: "quote-ready", ...r };
}

export function newQuoteAdminEmail(p: { company: string; number: string; id: string; to: string }): EmailMessage {
  const r = renderEmail({ title: e.newQuoteAdmin.title, blocks: [{ type: "paragraph", text: interpolate(e.newQuoteAdmin.body, { company: p.company, number: p.number }) }, { type: "cta", text: e.newQuoteAdmin.cta, href: `${base}/admin/quotes/${p.id}` }] });
  return { to: p.to, subject: interpolate(e.newQuoteAdmin.subject, { number: p.number }), template: "new-quote-admin", ...r };
}

export function invoiceAvailableEmail(p: { firstName: string; email: string; number: string; order: string; orderId: string }): EmailMessage {
  const r = renderEmail({ title: e.invoiceAvailable.title, greeting: greet(p.firstName), blocks: [{ type: "paragraph", text: interpolate(e.invoiceAvailable.body, { number: p.number, order: p.order }) }, { type: "cta", text: e.invoiceAvailable.cta, href: `${base}/account/invoices` }] });
  return { to: p.email, subject: interpolate(e.invoiceAvailable.subject, { number: p.number }), template: "invoice-available", ...r };
}
