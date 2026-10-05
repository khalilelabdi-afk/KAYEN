"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { CheckboxField } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogHeading } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { AddressFormFields } from "@/components/checkout/address-form-fields";
import { saveAddressAction, deleteAddressAction, setDefaultAddressAction, type FormState } from "@/app/actions/account";

export interface AddressRow { id: string; label: string | null; type: "BILLING" | "SHIPPING" | "BOTH"; company: string | null; firstName: string | null; lastName: string | null; line1: string; line2: string | null; postalCode: string; city: string; region: string | null; countryCode: string; phone: string | null; instructions: string | null; isDefaultBilling: boolean; isDefaultShipping: boolean }

export function AddressDialog({ address, trigger }: { address?: AddressRow; trigger?: React.ReactNode }) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(saveAddressAction, undefined);
  const [lastState, setLastState] = React.useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.success) setOpen(false);
  }
  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger ?? <Button size="sm"><Plus />{t("account.addresses.add")}</Button>}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg" closeLabel={t("common.actions.close")}>
          <form action={action} noValidate>
            {address && <input type="hidden" name="id" value={address.id} />}
            <DialogHeader><DialogHeading>{address ? t("account.addresses.edit") : t("account.addresses.add")}</DialogHeading></DialogHeader>
            <DialogBody className="space-y-4">
              <FormError message={state?.error} />
              <Field id="type" label={t("account.addresses.type")}>
                <Select name="type" defaultValue={address?.type ?? "BOTH"}>
                  {(["BOTH", "BILLING", "SHIPPING"] as const).map((v) => <option key={v} value={v}>{t.enum("account.addresses.types", v)}</option>)}
                </Select>
              </Field>
              <AddressFormFields defaults={address ? { label: address.label, company: address.company, firstName: address.firstName, lastName: address.lastName, line1: address.line1, line2: address.line2, postalCode: address.postalCode, city: address.city, region: address.region, countryCode: address.countryCode, phone: address.phone, instructions: address.instructions } : {}} errors={state?.fieldErrors ?? {}} />
              <div className="grid gap-2 sm:grid-cols-2">
                <CheckboxField id="isDefaultBilling" name="isDefaultBilling" label={t("account.addresses.defaultBilling")} defaultChecked={address?.isDefaultBilling} />
                <CheckboxField id="isDefaultShipping" name="isDefaultShipping" label={t("account.addresses.defaultShipping")} defaultChecked={address?.isDefaultShipping} />
              </div>
            </DialogBody>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.actions.cancel")}</Button><Button type="submit" loading={pending}>{t("common.actions.save")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AddressCardActions({ address }: { address: AddressRow }) {
  const t = useT();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      <AddressDialog address={address} trigger={<Button size="sm" variant="outline"><Pencil />{t("common.actions.edit")}</Button>} />
      {!address.isDefaultBilling && <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => toast.fromResult(await setDefaultAddressAction({ id: address.id, kind: "billing" })))}><Star />{t("account.addresses.setDefaultBilling")}</Button>}
      {!address.isDefaultShipping && <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => toast.fromResult(await setDefaultAddressAction({ id: address.id, kind: "shipping" })))}><Star />{t("account.addresses.setDefaultShipping")}</Button>}
      <Button size="sm" variant="ghost" className="text-error" disabled={pending} onClick={() => { if (window.confirm(t("account.addresses.deleteConfirm"))) start(async () => toast.fromResult(await deleteAddressAction({ id: address.id }))); }}><Trash2 />{t("account.addresses.delete")}</Button>
    </div>
  );
}
