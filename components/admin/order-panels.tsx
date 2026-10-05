"use client";

import * as React from "react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { orderStatusAction, orderNoteAction, orderMarkPaidAction, orderShipmentAction, orderInvoiceAction } from "@/app/actions/admin/sales";

export function OrderStatusPanel({ orderId, status, transitions, paymentStatus, hasInvoice }: { orderId: string; status: string; transitions: string[]; paymentStatus: string; hasInvoice: boolean }) {
  const t = useT();
  const toast = useToast();
  const [next, setNext] = React.useState(transitions[0] ?? "");
  const [note, setNote] = React.useState("");
  const [pending, start] = React.useTransition();
  const run = (fn: () => Promise<{ ok: true; message?: string } | { ok: false; error: string }>) => start(async () => toast.fromResult(await fn()));
  return (
    <div className="space-y-3">
      {transitions.length > 0 && (
        <form onSubmit={(e) => { e.preventDefault(); if (next === "CANCELLED" && !window.confirm(t("account.orders.detail.cancelConfirm"))) return; run(() => orderStatusAction({ orderId, status: next, note })); }} className="space-y-2">
          <Field id="status" label={t("admin.orders.detail.newStatus")}><Select value={next} onChange={(e) => setNext(e.target.value)}>{transitions.map((s) => <option key={s} value={s}>{t.enum("common.status.order", s)}</option>)}</Select></Field>
          <Field id="note" label={t("admin.orders.detail.statusNote")}><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <Button type="submit" size="sm" loading={pending}>{t("admin.orders.detail.updateStatus")}</Button>
        </form>
      )}
      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {paymentStatus !== "PAID" && status !== "CANCELLED" && <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => orderMarkPaidAction({ orderId }))}>{t("admin.orders.detail.markPaid")}</Button>}
        {!hasInvoice && status !== "CANCELLED" && <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => orderInvoiceAction({ orderId }))}>{t("admin.orders.detail.createInvoice")}</Button>}
        <Button size="sm" variant="ghost" onClick={() => window.print()}>{t("admin.orders.detail.print")}</Button>
      </div>
    </div>
  );
}

export function OrderShipmentForm({ orderId }: { orderId: string }) {
  const t = useT();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  const [form, setForm] = React.useState({ carrier: "", trackingNumber: "", trackingUrl: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await orderShipmentAction({ orderId, ...form }); if (r.ok) { toast.success(r.message ?? ""); setForm({ carrier: "", trackingNumber: "", trackingUrl: "" }); } else toast.error(r.error); }); }} className="grid gap-2 sm:grid-cols-3">
      <Field id="carrier" label={t("admin.orders.detail.carrier")}><Input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} /></Field>
      <Field id="trackingNumber" label={t("admin.orders.detail.trackingNumber")}><Input value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} /></Field>
      <Field id="trackingUrl" label={t("admin.orders.detail.trackingUrl")}><Input type="url" value={form.trackingUrl} onChange={(e) => setForm({ ...form, trackingUrl: e.target.value })} /></Field>
      <div className="sm:col-span-3"><Button type="submit" size="sm" variant="outline" loading={pending}>{t("admin.orders.detail.addShipment")}</Button></div>
    </form>
  );
}

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const t = useT();
  const toast = useToast();
  const [content, setContent] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await orderNoteAction({ orderId, content }); if (r.ok) { toast.success(r.message ?? ""); setContent(""); } else toast.error(r.error); }); }} className="space-y-2">
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={2} placeholder={t("admin.orders.detail.noteContent")} aria-label={t("admin.orders.detail.noteContent")} />
      <Button type="submit" size="sm" variant="outline" loading={pending} disabled={!content.trim()}>{t("admin.orders.detail.addNote")}</Button>
    </form>
  );
}
