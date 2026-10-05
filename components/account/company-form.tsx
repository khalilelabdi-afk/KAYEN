"use client";

import { useActionState } from "react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field, FormError, FormSuccess } from "@/components/ui/field";
import { updateCompanyAction, updateProfileAction, changePasswordAction, type FormState } from "@/app/actions/account";

export function CompanyForm({ company, sectors, taxIdLabel, readOnly }: { company: { name: string; legalName: string | null; taxId: string | null; registrationNumber: string | null; sectorId: string | null; phone: string | null; email: string | null; website: string | null }; sectors: { id: string; name: string }[]; taxIdLabel: string; readOnly: boolean }) {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(updateCompanyAction, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />
      <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label={t("account.company.name")} required error={fe.name}><Input name="name" defaultValue={company.name} required /></Field>
        <Field id="legalName" label={t("account.company.legalName")} error={fe.legalName}><Input name="legalName" defaultValue={company.legalName ?? ""} /></Field>
        <Field id="taxId" label={taxIdLabel} error={fe.taxId}><Input name="taxId" defaultValue={company.taxId ?? ""} /></Field>
        <Field id="registrationNumber" label={t("account.company.registrationNumber")} error={fe.registrationNumber}><Input name="registrationNumber" defaultValue={company.registrationNumber ?? ""} /></Field>
        <Field id="sectorId" label={t("account.company.sector")}><Select name="sectorId" defaultValue={company.sectorId ?? ""}><option value="">—</option>{sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <Field id="phone" label={t("account.company.phone")} error={fe.phone}><Input name="phone" type="tel" defaultValue={company.phone ?? ""} /></Field>
        <Field id="email" label={t("account.company.email")} error={fe.email}><Input name="email" type="email" defaultValue={company.email ?? ""} /></Field>
        <Field id="website" label={t("account.company.website")} error={fe.website}><Input name="website" type="url" defaultValue={company.website ?? ""} /></Field>
      </fieldset>
      {!readOnly && <Button type="submit" loading={pending}>{t("common.actions.save")}</Button>}
    </form>
  );
}

export function ProfileForm({ user }: { user: { firstName: string; lastName: string; phone: string | null; locale: string } }) {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="firstName" label={t("common.labels.firstName")} required error={state?.fieldErrors?.firstName}><Input name="firstName" defaultValue={user.firstName} required /></Field>
        <Field id="lastName" label={t("common.labels.lastName")} required error={state?.fieldErrors?.lastName}><Input name="lastName" defaultValue={user.lastName} required /></Field>
        <Field id="phone" label={t("common.labels.phone")} error={state?.fieldErrors?.phone}><Input name="phone" type="tel" defaultValue={user.phone ?? ""} /></Field>
        <Field id="locale" label={t("account.settings.language")}><Select name="locale" defaultValue={user.locale}><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option></Select></Field>
      </div>
      <Button type="submit" loading={pending}>{t("common.actions.save")}</Button>
    </form>
  );
}

export function PasswordForm() {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />
      <Field id="currentPassword" label={t("account.settings.currentPassword")} required error={state?.fieldErrors?.currentPassword}><Input name="currentPassword" type="password" autoComplete="current-password" required /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="password" label={t("account.settings.newPassword")} required hint={t("auth.register.passwordHint")} error={state?.fieldErrors?.password}><Input name="password" type="password" autoComplete="new-password" required minLength={8} /></Field>
        <Field id="passwordConfirm" label={t("common.labels.passwordConfirm")} required error={state?.fieldErrors?.passwordConfirm}><Input name="passwordConfirm" type="password" autoComplete="new-password" required /></Field>
      </div>
      <Button type="submit" variant="outline" loading={pending}>{t("account.settings.changePassword")}</Button>
    </form>
  );
}
