import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Paperclip } from "lucide-react";
import { getT } from "@/i18n/server";
import { requireBusinessUser } from "@/lib/auth/dal";
import { getBusinessQuote } from "@/services/quotes";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { AccountShell } from "@/components/account/account-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { QuoteDecision } from "@/components/account/quote-decision";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.quotes.title"), robots: { index: false } };
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t, user] = await Promise.all([params, getT(), requireBusinessUser("/account/quotes")]);
  const quote = await getBusinessQuote(user.business.id, id);
  if (!quote) notFound();
  const expired = quote.status === "EXPIRED" || (quote.validUntil && quote.validUntil < new Date() && quote.status === "QUOTED");
  const total = quote.quotedTotal ?? quote.items.reduce((s, i) => s + (i.quotedUnitPrice ?? 0) * i.quantity, 0);
  return (
    <AccountShell user={user} title={t("account.quotes.detail.title", { number: quote.number })}>
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted">
        <span>{t("account.quotes.detail.requestedOn", { date: formatDateTime(quote.createdAt) })}</span>
        <StatusBadge status={expired ? "EXPIRED" : quote.status} label={t.enum("common.status.quote", expired ? "EXPIRED" : quote.status)} />
        {quote.validUntil && <span>{t("account.quotes.validUntil", { date: formatDate(quote.validUntil) })}</span>}
        {quote.order && <Link href={`/account/orders/${quote.order.id}`} className="underline">{t("account.quotes.detail.order")} {quote.order.number}</Link>}
      </div>
      {["SUBMITTED", "IN_REVIEW"].includes(quote.status) && <Alert tone="info" className="mb-6">{t("account.quotes.detail.pending")}</Alert>}
      {expired && <Alert tone="warning" className="mb-6">{t("account.quotes.detail.expired")}</Alert>}
      {quote.status === "ACCEPTED" && <Alert tone="success" className="mb-6">{t("account.quotes.detail.accepted")}</Alert>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-border bg-surface">
          <h2 className="t-h4 border-b border-border px-4 py-3">{t("account.quotes.detail.items")}</h2>
          <table className="w-full text-sm">
            <thead className="bg-paper-2/70 text-xs text-muted"><tr><th className="px-4 py-2 text-start font-semibold">{t("quote.form.product")}</th><th className="px-4 py-2 text-end font-semibold">{t("quote.form.quantity")}</th><th className="px-4 py-2 text-end font-semibold">{t("account.quotes.detail.referencePrice")}</th><th className="px-4 py-2 text-end font-semibold">{t("account.quotes.detail.proposedPrice")}</th></tr></thead>
            <tbody>
              {quote.items.map((i) => (
                <tr key={i.id} className="border-t border-border"><td className="px-4 py-2.5"><span className="font-medium">{i.name}</span><span className="block text-xs text-muted">{i.sku}</span></td><td className="px-4 py-2.5 text-end tnum">{i.quantity}</td><td className="px-4 py-2.5 text-end text-muted tnum">{i.referenceUnitPrice !== null ? formatMoney(i.referenceUnitPrice) : "—"}</td><td className="px-4 py-2.5 text-end font-semibold tnum">{i.quotedUnitPrice !== null ? formatMoney(i.quotedUnitPrice) : "—"}</td></tr>
              ))}
            </tbody>
          </table>
          {quote.message && <div className="border-t border-border px-4 py-3 text-sm"><p className="t-label mb-1 text-muted">{t("account.quotes.detail.yourMessage")}</p><p className="whitespace-pre-line">{quote.message}</p></div>}
          {quote.attachmentUrl && <div className="border-t border-border px-4 py-3 text-sm"><a href={quote.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline"><Paperclip className="size-4" />{t("account.quotes.detail.attachment")}</a></div>}
          {quote.customerNote && quote.status === "QUOTED" && <div className="border-t border-border px-4 py-3 text-sm"><p className="t-label mb-1 text-muted">{t("account.quotes.detail.response")}</p><p className="whitespace-pre-line">{quote.customerNote}</p></div>}
        </section>
        <div className="space-y-4">
          {quote.status === "QUOTED" && !expired && (
            <section className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-muted">{t("account.quotes.detail.total")}</p>
              <p className="t-price-lg">{formatMoney(total)}</p>
              <div className="mt-4"><QuoteDecision quoteId={quote.id} /></div>
            </section>
          )}
          {quote.quotedTotal !== null && quote.status !== "QUOTED" && <section className="rounded-lg border border-border bg-surface p-4"><p className="text-sm text-muted">{t("account.quotes.detail.total")}</p><p className="t-price-lg">{formatMoney(quote.quotedTotal)}</p></section>}
        </div>
      </div>
    </AccountShell>
  );
}
