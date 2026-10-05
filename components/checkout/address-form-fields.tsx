"use client";

import { useT } from "@/i18n/client";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

/** Champs d'adresse réutilisables (checkout, espace client). `prefix` permet d'imbriquer dans un formulaire. */
export function AddressFormFields({ prefix = "", defaults = {}, errors = {}, withLabel = true, withInstructions = true }: { prefix?: string; defaults?: Partial<Record<string, string | null>>; errors?: Record<string, string[]>; withLabel?: boolean; withInstructions?: boolean }) {
  const t = useT();
  const n = (k: string) => (prefix ? `${prefix}.${k}` : k);
  const e = (k: string) => errors[n(k)] ?? errors[k];
  const id = (k: string) => (prefix ? `${prefix}-${k}` : k);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {withLabel && <Field id={id("label")} label={t("account.addresses.label")} optionalLabel={t("common.labels.optional")} error={e("label")} className="sm:col-span-2"><Input name={n("label")} placeholder={t("account.addresses.labelPlaceholder")} defaultValue={defaults.label ?? ""} /></Field>}
      <Field id={id("company")} label={t("common.labels.company")} error={e("company")} className="sm:col-span-2"><Input name={n("company")} autoComplete="organization" defaultValue={defaults.company ?? ""} /></Field>
      <Field id={id("firstName")} label={t("common.labels.firstName")} error={e("firstName")}><Input name={n("firstName")} autoComplete="given-name" defaultValue={defaults.firstName ?? ""} /></Field>
      <Field id={id("lastName")} label={t("common.labels.lastName")} error={e("lastName")}><Input name={n("lastName")} autoComplete="family-name" defaultValue={defaults.lastName ?? ""} /></Field>
      <Field id={id("line1")} label={t("common.labels.address")} required error={e("line1")} className="sm:col-span-2"><Input name={n("line1")} autoComplete="address-line1" required defaultValue={defaults.line1 ?? ""} /></Field>
      <Field id={id("line2")} label={t("common.labels.addressLine2")} optionalLabel={t("common.labels.optional")} error={e("line2")} className="sm:col-span-2"><Input name={n("line2")} autoComplete="address-line2" defaultValue={defaults.line2 ?? ""} /></Field>
      <Field id={id("postalCode")} label={t("common.labels.postalCode")} required error={e("postalCode")}><Input name={n("postalCode")} autoComplete="postal-code" required defaultValue={defaults.postalCode ?? ""} /></Field>
      <Field id={id("city")} label={t("common.labels.city")} required error={e("city")}><Input name={n("city")} autoComplete="address-level2" required defaultValue={defaults.city ?? ""} /></Field>
      <Field id={id("countryCode")} label={t("common.labels.country")} required error={e("countryCode")}><Input name={n("countryCode")} autoComplete="country" required maxLength={2} defaultValue={defaults.countryCode ?? "FR"} className="uppercase" /></Field>
      <Field id={id("phone")} label={t("common.labels.phone")} optionalLabel={t("common.labels.optional")} error={e("phone")}><Input name={n("phone")} type="tel" autoComplete="tel" defaultValue={defaults.phone ?? ""} /></Field>
      {withInstructions && <Field id={id("instructions")} label={t("common.labels.deliveryInstructions")} optionalLabel={t("common.labels.optional")} error={e("instructions")} className="sm:col-span-2"><Textarea name={n("instructions")} rows={2} defaultValue={defaults.instructions ?? ""} /></Field>}
    </div>
  );
}
