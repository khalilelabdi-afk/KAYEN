"use client";

import { useActionState } from "react";
import { useT } from "@/i18n/client";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { RadioGroup, RadioCard } from "@/components/ui/checkbox";
import { checkoutShippingAction, type CheckoutFormState } from "@/app/actions/checkout";

export interface ShippingMethodOption { code: string; name: string; description: string | null; price: number; isFree: boolean; minDays: number; maxDays: number }

export function ShippingForm({ methods, selected }: { methods: ShippingMethodOption[]; selected?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState<CheckoutFormState, FormData>(checkoutShippingAction, undefined);
  if (!methods.length) return <p className="rounded-md bg-warning-soft px-4 py-3 text-sm text-warning">{t("checkout.shipping.noMethod")}</p>;
  return (
    <form action={action} className="space-y-6" noValidate>
      <FormError message={state?.error} />
      <RadioGroup name="shippingMethodCode" defaultValue={selected ?? methods[0].code}>
        {methods.map((m) => (
          <RadioCard key={m.code} value={m.code} id={`ship-${m.code}`} title={m.name} description={`${m.description ? `${m.description} · ` : ""}${t("checkout.shipping.delay", { min: m.minDays, max: m.maxDays })}`} trailing={m.isFree ? t("checkout.shipping.free") : formatMoney(m.price)} />
        ))}
      </RadioGroup>
      <Button type="submit" size="lg" loading={pending}>{t("checkout.shipping.continue")}</Button>
    </form>
  );
}
