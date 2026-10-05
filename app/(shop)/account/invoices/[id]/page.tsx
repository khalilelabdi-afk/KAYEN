import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { requireBusinessUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { getSettings } from "@/services/settings";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { formatAddress, type AddressSnapshot } from "@/services/orders";
import { PrintButton } from "@/components/account/print-button";

/** Facture imprimable (PDF via impression navigateur). Un générateur PDF serveur peut remplacer cette page. */
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t, user, settings] = await Promise.all([params, getT(), requireBusinessUser("/account/invoices"), getSettings()]);
  const invoice = await db.invoice.findFirst({ where: { id, businessId: user.business.id }, include: { order: { include: { items: true } }, business: true } });
  if (!invoice) notFound();
  const o = invoice.order;
  const billing = o.billingAddress as unknown as AddressSnapshot;
  return (
    <div className="container-site max-w-3xl py-8 print:max-w-none print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden"><h1 className="t-h2">{t("account.invoices.number")} {invoice.number}</h1><PrintButton label={t("common.actions.print")} /></div>
      <div className="rounded-lg border border-border bg-surface p-8 text-sm print:border-0 print:p-0">
        <div className="flex items-start justify-between gap-6">
          <div><p className="font-display text-2xl font-extrabold tracking-tighter">KAYEN</p><p className="mt-2 text-muted">{settings.companyAddress.line1}<br />{settings.companyAddress.postalCode} {settings.companyAddress.city}<br />{settings.supportEmail}</p></div>
          <div className="text-end"><p className="t-h3">{t("account.invoices.number")} {invoice.number}</p><p className="text-muted">{t("account.invoices.date")} : {formatDate(invoice.issuedAt)}</p>{invoice.dueAt && <p className="text-muted">{t("account.invoices.due")} : {formatDate(invoice.dueAt)}</p>}<p className="text-muted">{t("account.invoices.order")} : {o.number}</p>{o.poReference && <p className="text-muted">{t("common.labels.poReference")} : {o.poReference}</p>}</div>
        </div>
        <div className="mt-8"><p className="t-label text-muted">{t("checkout.information.billingAddress")}</p><p className="mt-1 font-medium">{invoice.business.legalName ?? invoice.business.name}</p><p>{formatAddress(billing)}</p>{invoice.business.taxId && <p className="text-muted">{settings.taxIdLabel} : {invoice.business.taxId}</p>}</div>
        <table className="mt-8 w-full">
          <thead className="border-b border-border text-xs text-muted"><tr><th className="py-2 text-start font-semibold">{t("common.labels.sku")}</th><th className="py-2 text-start font-semibold">{t("common.labels.name")}</th><th className="py-2 text-end font-semibold">{t("common.labels.quantity")}</th><th className="py-2 text-end font-semibold">{t("common.labels.unitPrice")}</th><th className="py-2 text-end font-semibold">{t("common.labels.tax")}</th><th className="py-2 text-end font-semibold">{t("common.labels.total")} {t("common.labels.taxExcluded")}</th></tr></thead>
          <tbody>
            {o.items.map((i) => (<tr key={i.id} className="border-b border-border"><td className="py-2 text-xs">{i.sku}</td><td className="py-2">{i.name}{i.variantName && ` — ${i.variantName}`}</td><td className="py-2 text-end tnum">{i.quantity}</td><td className="py-2 text-end tnum">{formatMoney(i.unitPrice)}</td><td className="py-2 text-end tnum">{(i.taxRateBps / 100).toLocaleString("fr-FR")} %</td><td className="py-2 text-end tnum">{formatMoney(i.lineSubtotal - i.discountAmount)}</td></tr>))}
          </tbody>
        </table>
        <dl className="ms-auto mt-6 w-72 space-y-1">
          <div className="flex justify-between"><dt className="text-muted">{t("cart.summary.subtotal")}</dt><dd className="tnum">{formatMoney(o.subtotal)}</dd></div>
          {o.discountTotal > 0 && <div className="flex justify-between"><dt className="text-muted">{t("cart.summary.discount")}</dt><dd className="tnum">-{formatMoney(o.discountTotal)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">{t("cart.summary.shipping")}</dt><dd className="tnum">{formatMoney(o.shippingTotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{t("cart.summary.tax")}</dt><dd className="tnum">{formatMoney(o.taxTotal)}</dd></div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>{t("cart.summary.total")}</dt><dd className="tnum">{formatMoney(o.total)}</dd></div>
        </dl>
        <p className="mt-8 text-xs text-muted">{t.enum("common.status.paymentMethod", o.paymentMethod)} · {t.enum("common.status.invoice", invoice.status)}{o.paymentMethod === "BANK_TRANSFER" && ` · ${settings.bankDetails}`}</p>
      </div>
    </div>
  );
}
