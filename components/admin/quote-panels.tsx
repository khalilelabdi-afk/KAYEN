"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/i18n/client";
import { formatMoney, parseMoneyInput, toMoneyInput } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogHeading, DialogText } from "@/components/ui/dialog";
import { sendQuoteAction, quoteStatusAction, convertQuoteAction } from "@/app/actions/admin/sales";

function defaultValidUntil(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

export interface QuoteItemRow { id: string; sku: string; name: string; quantity: number; referenceUnitPrice: number | null; quotedUnitPrice: number | null }

export function QuoteEditor({ quoteId, items, status, validUntil, customerNote, adminNotes, defaultValidityDays }: { quoteId: string; items: QuoteItemRow[]; status: string; validUntil: string | null; customerNote: string | null; adminNotes: string | null; defaultValidityDays: number }) {
  const t = useT();
  const toast = useToast();
  const [rows, setRows] = React.useState(items.map((i) => ({ ...i, price: toMoneyInput(i.quotedUnitPrice ?? i.referenceUnitPrice ?? 0), qty: String(i.quantity) })));
  const [valid, setValid] = React.useState(() => validUntil ?? defaultValidUntil(defaultValidityDays));
  const [note, setNote] = React.useState(customerNote ?? "");
  const [internal, setInternal] = React.useState(adminNotes ?? "");
  const [pending, start] = React.useTransition();
  const total = rows.reduce((s, r) => s + (parseMoneyInput(r.price) ?? 0) * (Number.parseInt(r.qty, 10) || 0), 0);
  const editable = ["SUBMITTED", "IN_REVIEW", "QUOTED"].includes(status);

  const send = () =>
    start(async () => {
      const payload = rows.map((r) => ({ id: r.id, quotedUnitPrice: parseMoneyInput(r.price) ?? 0, quantity: Number.parseInt(r.qty, 10) || 1 }));
      toast.fromResult(await sendQuoteAction({ quoteId, validUntil: valid, customerNote: note, adminNotes: internal, items: payload }));
    });
  const setStatus = (s: "IN_REVIEW" | "REJECTED" | "EXPIRED") => start(async () => toast.fromResult(await quoteStatusAction({ quoteId, status: s, adminNotes: internal })));

  return (
    <div className="space-y-4">
      <table className="w-full text-sm">
        <thead className="bg-paper-2/70 text-xs text-muted"><tr><th className="px-3 py-2 text-start font-semibold">{t("admin.quotes.detail.items")}</th><th className="px-3 py-2 text-end font-semibold">{t("common.labels.quantity")}</th><th className="px-3 py-2 text-end font-semibold">{t("admin.quotes.detail.referencePrice")}</th><th className="px-3 py-2 text-end font-semibold">{t("admin.quotes.detail.quotedPrice")}</th><th className="px-3 py-2 text-end font-semibold">{t("common.labels.total")}</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-t border-border">
              <td className="px-3 py-2"><span className="font-medium">{r.name}</span><span className="block font-mono text-xs text-muted">{r.sku}</span></td>
              <td className="px-3 py-2 text-end"><Input type="number" min={1} value={r.qty} disabled={!editable} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} className="h-8 w-20 text-end text-sm" /></td>
              <td className="px-3 py-2 text-end text-muted tnum">{r.referenceUnitPrice !== null ? formatMoney(r.referenceUnitPrice) : "—"}</td>
              <td className="px-3 py-2 text-end"><Input inputMode="decimal" value={r.price} disabled={!editable} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} className="h-8 w-28 text-end text-sm" /></td>
              <td className="px-3 py-2 text-end font-semibold tnum">{formatMoney((parseMoneyInput(r.price) ?? 0) * (Number.parseInt(r.qty, 10) || 0))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr className="border-t border-border"><td colSpan={4} className="px-3 py-2 text-end font-semibold">{t("admin.quotes.detail.total")}</td><td className="px-3 py-2 text-end text-base font-bold tnum">{formatMoney(total)}</td></tr></tfoot>
      </table>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="validUntil" label={t("admin.quotes.detail.validUntil")}><Input type="date" value={valid} disabled={!editable} onChange={(e) => setValid(e.target.value)} /></Field>
      </div>
      <Field id="customerNote" label={t("admin.quotes.detail.customerNote")}><Textarea value={note} disabled={!editable} onChange={(e) => setNote(e.target.value)} rows={3} /></Field>
      <Field id="adminNotes" label={t("admin.quotes.detail.adminNotes")}><Textarea value={internal} onChange={(e) => setInternal(e.target.value)} rows={2} /></Field>
      {editable && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={send} loading={pending}>{t("admin.quotes.detail.sendQuote")}</Button>
          {status === "SUBMITTED" && <Button variant="outline" disabled={pending} onClick={() => setStatus("IN_REVIEW")}>{t("admin.quotes.detail.markInReview")}</Button>}
          <Button variant="danger-outline" disabled={pending} onClick={() => setStatus("REJECTED")}>{t("admin.quotes.detail.reject")}</Button>
          {status === "QUOTED" && <Button variant="ghost" disabled={pending} onClick={() => setStatus("EXPIRED")}>{t("admin.quotes.detail.expire")}</Button>}
        </div>
      )}
    </div>
  );
}

export function ConvertQuoteDialog({ quoteId, addresses, methods, invoiceAllowed }: { quoteId: string; addresses: { id: string; label: string }[]; methods: { code: string; name: string }[]; invoiceAllowed: boolean }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [addressId, setAddressId] = React.useState(addresses[0]?.id ?? "");
  const [method, setMethod] = React.useState(methods[0]?.code ?? "");
  const [payment, setPayment] = React.useState<"BANK_TRANSFER" | "INVOICE">(invoiceAllowed ? "INVOICE" : "BANK_TRANSFER");
  const [pending, start] = React.useTransition();
  return (
    <>
      <Button variant="accent" onClick={() => setOpen(true)}>{t("admin.quotes.detail.convert")}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm" closeLabel={t("common.actions.close")}>
          <DialogHeader><DialogHeading>{t("admin.quotes.detail.convert")}</DialogHeading><DialogText>{t("admin.quotes.detail.convertDesc")}</DialogText></DialogHeader>
          <DialogBody className="space-y-3">
            <Field id="cv-address" label={t("admin.quotes.detail.selectAddress")}><Select value={addressId} onChange={(e) => setAddressId(e.target.value)}>{addresses.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</Select></Field>
            <Field id="cv-method" label={t("admin.quotes.detail.selectShipping")}><Select value={method} onChange={(e) => setMethod(e.target.value)}>{methods.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}</Select></Field>
            <Field id="cv-payment" label={t("admin.quotes.detail.paymentMethod")}><Select value={payment} onChange={(e) => setPayment(e.target.value as "INVOICE")}><option value="BANK_TRANSFER">{t("checkout.payment.bankTransfer")}</option>{invoiceAllowed && <option value="INVOICE">{t("checkout.payment.invoice")}</option>}</Select></Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.actions.cancel")}</Button>
            <Button loading={pending} disabled={!addressId || !method} onClick={() => start(async () => { const r = await convertQuoteAction({ quoteId, addressId, shippingMethodCode: method, paymentMethod: payment }); if (r.ok) { toast.success(r.message ?? ""); setOpen(false); router.push(`/admin/orders/${r.data!.orderId}`); } else toast.error(r.error); })}>{t("common.actions.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
