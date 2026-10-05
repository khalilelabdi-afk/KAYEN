"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field, FormError, FormSuccess } from "@/components/ui/field";
import { CheckboxField } from "@/components/ui/checkbox";
import { loginAction, registerAction, forgotPasswordAction, resetPasswordAction, type AuthState } from "@/app/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FormError message={state?.error} />
      <Field id="email" label={t("auth.login.email")} required error={state?.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} />
      </Field>
      <Field id="password" label={t("auth.login.password")} required error={state?.fieldErrors?.password}>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="flex items-center justify-between">
        <CheckboxField id="remember" name="remember" label={t("auth.login.remember")} />
        <Link href="/forgot-password" className="text-sm text-muted underline underline-offset-2 hover:text-foreground">{t("auth.login.forgot")}</Link>
      </div>
      <Button type="submit" size="lg" fullWidth loading={pending}>{t("auth.login.submit")}</Button>
    </form>
  );
}

export function RegisterForm({ sectors, taxIdLabel, taxIdPlaceholder, next }: { sectors: { id: string; name: string }[]; taxIdLabel: string; taxIdPlaceholder: string; next?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, undefined);
  const v = state?.values ?? {};
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-6" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FormError message={state?.error} />
      <fieldset className="space-y-4">
        <legend className="t-h4 mb-1">{t("auth.register.step1")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="firstName" label={t("auth.register.firstName")} required error={fe.firstName}><Input name="firstName" autoComplete="given-name" required defaultValue={v.firstName} /></Field>
          <Field id="lastName" label={t("auth.register.lastName")} required error={fe.lastName}><Input name="lastName" autoComplete="family-name" required defaultValue={v.lastName} /></Field>
        </div>
        <Field id="email" label={t("auth.register.email")} required error={fe.email}><Input name="email" type="email" autoComplete="email" required defaultValue={v.email} /></Field>
        <Field id="phone" label={t("auth.register.phone")} optionalLabel={t("common.labels.optional")} error={fe.phone}><Input name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="password" label={t("auth.register.password")} required hint={t("auth.register.passwordHint")} error={fe.password}><Input name="password" type="password" autoComplete="new-password" required minLength={8} /></Field>
          <Field id="passwordConfirm" label={t("auth.register.passwordConfirm")} required error={fe.passwordConfirm}><Input name="passwordConfirm" type="password" autoComplete="new-password" required /></Field>
        </div>
      </fieldset>
      <fieldset className="space-y-4 border-t border-border pt-6">
        <legend className="t-h4 mb-1 pt-6">{t("auth.register.step2")}</legend>
        <Field id="company" label={t("auth.register.company")} required error={fe.company}><Input name="company" autoComplete="organization" required defaultValue={v.company} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="sectorId" label={t("auth.register.sector")} error={fe.sectorId}>
            <Select name="sectorId" defaultValue={v.sectorId ?? ""} placeholder={t("auth.register.sectorPlaceholder")}>
              {sectors.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              <option value="">{t("auth.register.sectorOther")}</option>
            </Select>
          </Field>
          <Field id="taxId" label={taxIdLabel} optionalLabel={t("common.labels.optional")} hint={t("auth.register.taxIdHint")} error={fe.taxId}><Input name="taxId" placeholder={taxIdPlaceholder} defaultValue={v.taxId} /></Field>
        </div>
        <Field id="line1" label={t("auth.register.address")} optionalLabel={t("common.labels.optional")} error={fe.line1}><Input name="line1" autoComplete="address-line1" defaultValue={v.line1} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="postalCode" label={t("auth.register.postalCode")} error={fe.postalCode}><Input name="postalCode" autoComplete="postal-code" defaultValue={v.postalCode} /></Field>
          <Field id="city" label={t("auth.register.city")} error={fe.city}><Input name="city" autoComplete="address-level2" defaultValue={v.city} /></Field>
          <Field id="countryCode" label={t("auth.register.country")} error={fe.countryCode}><Input name="countryCode" autoComplete="country" defaultValue={v.countryCode ?? "FR"} maxLength={2} /></Field>
        </div>
      </fieldset>
      <div>
        <CheckboxField id="terms" name="terms" label={t("auth.register.terms")} />
        {fe.terms && <p className="mt-1 text-xs font-medium text-error" role="alert">{fe.terms[0]}</p>}
      </div>
      <Button type="submit" size="lg" fullWidth loading={pending}>{t("auth.register.submit")}</Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const t = useT();
  const [state, action, pending] = useActionState<AuthState, FormData>(forgotPasswordAction, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError message={state?.error} />
      <FormSuccess message={state?.success} />
      <Field id="email" label={t("auth.forgot.email")} required><Input name="email" type="email" autoComplete="email" required /></Field>
      <Button type="submit" size="lg" fullWidth loading={pending}>{t("auth.forgot.submit")}</Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useT();
  const [state, action, pending] = useActionState<AuthState, FormData>(resetPasswordAction, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormError message={state?.error} />
      <Field id="password" label={t("auth.reset.password")} required hint={t("auth.register.passwordHint")} error={state?.fieldErrors?.password}><Input name="password" type="password" autoComplete="new-password" required minLength={8} /></Field>
      <Field id="passwordConfirm" label={t("auth.reset.passwordConfirm")} required error={state?.fieldErrors?.passwordConfirm}><Input name="passwordConfirm" type="password" autoComplete="new-password" required /></Field>
      <Button type="submit" size="lg" fullWidth loading={pending}>{t("auth.reset.submit")}</Button>
    </form>
  );
}
