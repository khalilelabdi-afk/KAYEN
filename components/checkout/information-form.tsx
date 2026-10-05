"use client";

import * as React from "react";
import { useActionState } from "react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { CheckboxField, RadioGroup, RadioCard } from "@/components/ui/checkbox";
import { AddressFormFields } from "./address-form-fields";
import { checkoutInformationAction, type CheckoutFormState, type CheckoutState } from "@/app/actions/checkout";

export interface AddressOption { id: string; label: string | null; company: string | null; line1: string; line2: string | null; postalCode: string; city: string; countryCode: string; isDefaultBilling: boolean; isDefaultShipping: boolean }

function AddressPicker({ name, addresses, value, onChange, newLabel }: { name: string; addresses: AddressOption[]; value: string; onChange: (v: string) => void; newLabel: string }) {
  return (
    <RadioGroup name={name} value={value} onValueChange={onChange}>
      {addresses.map((a) => (
        <RadioCard key={a.id} value={a.id} id={`${name}-${a.id}`} title={a.label ?? a.company ?? a.line1} description={`${a.company ? `${a.company} · ` : ""}${a.line1}${a.line2 ? `, ${a.line2}` : ""}, ${a.postalCode} ${a.city}, ${a.countryCode}`} />
      ))}
      <RadioCard value="new" id={`${name}-new`} title={newLabel} />
    </RadioGroup>
  );
}

export function InformationForm({ addresses, state, company, contact }: { addresses: AddressOption[]; state: CheckoutState; company: string; contact: { name: string; email: string; phone: string | null } }) {
  const t = useT();
  const [formState, action, pending] = useActionState<CheckoutFormState, FormData>(checkoutInformationAction, undefined);
  const defaultBilling = state.billingAddressId ?? addresses.find((a) => a.isDefaultBilling)?.id ?? addresses[0]?.id ?? "new";
  const defaultShipping = state.shippingAddressId ?? addresses.find((a) => a.isDefaultShipping)?.id ?? addresses[0]?.id ?? "new";
  const [billing, setBilling] = React.useState(defaultBilling);
  const [shipping, setShipping] = React.useState(defaultShipping);
  const [same, setSame] = React.useState(state.shippingAddressId ? state.shippingAddressId === state.billingAddressId : addresses.length <= 1);
  const fe = formState?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-8" noValidate>
      <FormError message={formState?.error} />
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="t-h4">{t("checkout.information.company")}</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">{t("common.labels.company")}</dt><dd className="font-medium">{company}</dd></div>
          <div><dt className="text-muted">{t("checkout.information.contact")}</dt><dd className="font-medium">{contact.name} · {contact.email}{contact.phone && ` · ${contact.phone}`}</dd></div>
        </dl>
      </section>

      <section className="space-y-4">
        <h2 className="t-h4">{t("checkout.information.billingAddress")}</h2>
        <AddressPicker name="billingAddressId" addresses={addresses} value={billing} onChange={setBilling} newLabel={t("checkout.information.newAddress")} />
        {billing === "new" && <div className="rounded-lg border border-border bg-surface p-5"><AddressFormFields prefix="newBilling" errors={fe} /></div>}
        {fe.billingAddressId && <p className="text-xs text-error">{fe.billingAddressId[0]}</p>}
      </section>

      <section className="space-y-4">
        <h2 className="t-h4">{t("checkout.information.shippingAddress")}</h2>
        <CheckboxField id="sameAsBilling" name="sameAsBilling" label={t("checkout.information.sameAsBilling")} checked={same} onCheckedChange={(c) => setSame(c === true)} />
        {!same && (
          <>
            <AddressPicker name="shippingAddressId" addresses={addresses} value={shipping} onChange={setShipping} newLabel={t("checkout.information.newAddress")} />
            {shipping === "new" && <div className="rounded-lg border border-border bg-surface p-5"><AddressFormFields prefix="newShipping" errors={fe} /></div>}
          </>
        )}
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2">
        <Field id="poReference" label={t("checkout.information.poReference")} hint={t("checkout.information.poReferenceHint")} optionalLabel={t("common.labels.optional")}><Input name="poReference" defaultValue={state.poReference ?? ""} maxLength={80} /></Field>
        <Field id="deliveryInstructions" label={t("checkout.information.deliveryInstructions")} hint={t("checkout.information.deliveryInstructionsHint")} optionalLabel={t("common.labels.optional")} className="sm:col-span-2"><Textarea name="deliveryInstructions" rows={2} defaultValue={state.deliveryInstructions ?? ""} /></Field>
        <Field id="notes" label={t("checkout.information.notes")} optionalLabel={t("common.labels.optional")} className="sm:col-span-2"><Textarea name="notes" rows={2} defaultValue={state.notes ?? ""} /></Field>
      </section>
      <Button type="submit" size="lg" loading={pending}>{t("checkout.information.continue")}</Button>
    </form>
  );
}
