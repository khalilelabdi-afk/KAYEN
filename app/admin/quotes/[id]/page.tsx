import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { getSettings, getShippingMethods } from "@/services/settings";
import { formatDateTime } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard, DescriptionList } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { QuoteEditor, ConvertQuoteDialog } from "@/components/admin/quote-panels";

export default async function AdminQuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t, settings, methods] = await Promise.all([params, getT(), getSettings(), getShippingMethods()]);
  const quote = await db.quote.findUnique({ where: { id }, include: { items: { orderBy: { id: "asc" } }, business: { include: { addresses: true } }, user: true, order: { select: { id: true, number: true } } } });
  if (!quote) notFound();
  const canConvert = quote.business && ["ACCEPTED", "QUOTED"].includes(quote.status) && quote.items.length > 0;
  return (
    <AdminShell title={t("admin.quotes.detail.title", { number: quote.number })} breadcrumb={[{ label: t("admin.nav.quotes"), href: "/admin/quotes" }, { label: quote.number }]} actions={<><StatusBadge status={quote.status} label={t.enum("common.status.quote", quote.status)} className="text-sm" />{canConvert && <ConvertQuoteDialog quoteId={quote.id} addresses={quote.business!.addresses.map((a) => ({ id: a.id, label: `${a.label ?? a.line1} — ${a.postalCode} ${a.city}` }))} methods={methods.map((m) => ({ code: m.code, name: m.name }))} invoiceAllowed={quote.business!.allowInvoicePay} />}</>}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard title={t("admin.quotes.detail.items")}>
          <QuoteEditor quoteId={quote.id} status={quote.status} items={quote.items.map((i) => ({ id: i.id, sku: i.sku, name: i.name, quantity: i.quantity, referenceUnitPrice: i.referenceUnitPrice, quotedUnitPrice: i.quotedUnitPrice }))} validUntil={quote.validUntil?.toISOString().slice(0, 10) ?? null} customerNote={quote.customerNote} adminNotes={quote.adminNotes} defaultValidityDays={settings.quoteValidityDays} />
        </AdminCard>
        <div className="space-y-6">
          <AdminCard title={t("admin.quotes.detail.request")}>
            <DescriptionList items={[
              { label: t("common.labels.company"), value: quote.business ? <Link href={`/admin/customers/${quote.business.id}`} className="underline">{quote.companyName}</Link> : quote.companyName },
              { label: t("quote.form.contact"), value: quote.contactName },
              { label: t("common.labels.email"), value: <a href={`mailto:${quote.email}`} className="underline">{quote.email}</a> },
              { label: t("common.labels.phone"), value: quote.phone },
              { label: t("quote.form.desiredDate"), value: quote.desiredDate ? formatDateTime(quote.desiredDate) : null },
              { label: t("common.labels.created"), value: formatDateTime(quote.createdAt) },
              { label: t("admin.quotes.detail.attachment"), value: quote.attachmentUrl ? <a href={quote.attachmentUrl} target="_blank" rel="noopener noreferrer" className="underline">↗</a> : null },
              { label: t("admin.nav.orders"), value: quote.order ? <Link href={`/admin/orders/${quote.order.id}`} className="underline">{quote.order.number}</Link> : null },
            ]} />
            {quote.message && <p className="mt-4 whitespace-pre-line rounded-md bg-paper px-3 py-2 text-sm">{quote.message}</p>}
          </AdminCard>
        </div>
      </div>
    </AdminShell>
  );
}
