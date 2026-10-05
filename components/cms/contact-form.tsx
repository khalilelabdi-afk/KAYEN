"use client";

import { useActionState } from "react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field, FormError, FormSuccess } from "@/components/ui/field";
import { contactAction, type ContactState } from "@/app/actions/contact";

export function ContactForm({ defaultSubject }: { defaultSubject?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState<ContactState, FormData>(contactAction, undefined);
  const v = state?.values ?? {};
  const fe = state?.fieldErrors ?? {};
  const subjects = ["sales", "order", "quote", "account", "product", "other"] as const;
  if (state?.success) return <FormSuccess message={state.success} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError message={state?.error} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label={t("cms.contact.form.name")} required error={fe.name}><Input name="name" required defaultValue={v.name} autoComplete="name" /></Field>
        <Field id="company" label={t("cms.contact.form.company")} optionalLabel={t("common.labels.optional")} error={fe.company}><Input name="company" defaultValue={v.company} autoComplete="organization" /></Field>
        <Field id="email" label={t("cms.contact.form.email")} required error={fe.email}><Input name="email" type="email" required defaultValue={v.email} autoComplete="email" /></Field>
        <Field id="phone" label={t("cms.contact.form.phone")} optionalLabel={t("common.labels.optional")} error={fe.phone}><Input name="phone" type="tel" defaultValue={v.phone} autoComplete="tel" /></Field>
      </div>
      <Field id="subject" label={t("cms.contact.form.subject")} required error={fe.subject}>
        <Select name="subject" defaultValue={v.subject ?? defaultSubject ?? "sales"} required>
          {subjects.map((s) => (<option key={s} value={s}>{t.enum("cms.contact.form.subjects", s)}</option>))}
        </Select>
      </Field>
      <Field id="message" label={t("cms.contact.form.message")} required error={fe.message}><Textarea name="message" rows={6} required defaultValue={v.message} /></Field>
      <Button type="submit" size="lg" loading={pending}>{t("cms.contact.form.submit")}</Button>
    </form>
  );
}
