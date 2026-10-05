"use client";

import * as React from "react";
import { useActionState } from "react";
import { CreditCard, Landmark, FileText } from "lucide-react";
import { useT } from "@/i18n/client";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { CheckboxField, RadioGroup, RadioCard } from "@/components/ui/checkbox";
import { checkoutPaymentAction, type CheckoutFormState } from "@/app/actions/checkout";
import { track } from "@/lib/analytics";

export function PaymentForm({ total, invoiceAllowed, invoiceDays, cardProvider }: { total: number; invoiceAllowed: boolean; invoiceDays: number; cardProvider: string }) {
  const t = useT();
  const [state, action, pending] = useActionState<CheckoutFormState, FormData>(checkoutPaymentAction, undefined);
  const [method, setMethod] = React.useState<"CARD" | "BANK_TRANSFER" | "INVOICE">("CARD");
  React.useEffect(() => { track({ name: "begin_checkout", params: { value: total / 100, currency: "EUR", items: 0 } }); }, [total]);
  return (
    <form action={action} className="space-y-6" noValidate>
      <FormError message={state?.error} />
      <RadioGroup name="paymentMethod" value={method} onValueChange={(v) => setMethod(v as typeof method)}>
        <RadioCard value="CARD" id="pay-card" title={<span className="inline-flex items-center gap-2"><CreditCard className="size-4" />{t("checkout.payment.card")}</span>} description={t("checkout.payment.cardDesc")}>
          {method === "CARD" && (
            <div className="mt-3 space-y-3">
              {cardProvider === "mock" && <p className="rounded-md bg-info-soft px-3 py-2 text-xs text-info">{t("checkout.payment.mockNotice")}</p>}
              <Field id="cardName" label={t("checkout.payment.cardName")} required><Input name="cardName" autoComplete="cc-name" required /></Field>
              <Field id="cardNumber" label={t("checkout.payment.cardNumber")} required><Input name="cardNumber" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="cardExpiry" label={t("checkout.payment.cardExpiry")} required><Input name="cardExpiry" inputMode="numeric" autoComplete="cc-exp" placeholder="12/28" required /></Field>
                <Field id="cardCvc" label={t("checkout.payment.cardCvc")} required><Input name="cardCvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" required /></Field>
              </div>
            </div>
          )}
        </RadioCard>
        <RadioCard value="BANK_TRANSFER" id="pay-transfer" title={<span className="inline-flex items-center gap-2"><Landmark className="size-4" />{t("checkout.payment.bankTransfer")}</span>} description={t("checkout.payment.bankTransferDesc")} />
        <RadioCard value="INVOICE" id="pay-invoice" disabled={!invoiceAllowed} title={<span className="inline-flex items-center gap-2"><FileText className="size-4" />{t("checkout.payment.invoice")}</span>} description={invoiceAllowed ? t("checkout.payment.invoiceDesc", { days: invoiceDays }) : t("checkout.payment.invoiceUnavailable")} />
      </RadioGroup>
      <div>
        <CheckboxField id="terms" name="terms" label={t("checkout.payment.terms")} />
        {state?.fieldErrors?.terms && <p className="mt-1 text-xs text-error">{t("checkout.errors.termsRequired")}</p>}
      </div>
      <Button type="submit" size="xl" fullWidth loading={pending}>{pending ? t("checkout.payment.processing") : t("checkout.payment.placeOrderWithTotal", { total: formatMoney(total) })}</Button>
    </form>
  );
}
