"use client";

import * as React from "react";
import { useActionState } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field, FormError, FormSuccess } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogHeading, DialogText } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { inviteUserAction, updateMemberRoleAction, removeMemberAction, type FormState } from "@/app/actions/account";

const ROLES = ["ADMIN", "BUYER", "VIEWER"] as const;

export function InviteUserDialog() {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(inviteUserAction, undefined);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><UserPlus />{t("account.users.invite")}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm" closeLabel={t("common.actions.close")}>
          <form action={action} noValidate>
            <DialogHeader><DialogHeading>{t("account.users.invite")}</DialogHeading><DialogText>{t("account.users.inviteDesc")}</DialogText></DialogHeader>
            <DialogBody className="space-y-3">
              <FormError message={state?.error} />
              <FormSuccess message={state?.success} />
              <div className="grid grid-cols-2 gap-3">
                <Field id="inv-first" label={t("common.labels.firstName")} required error={state?.fieldErrors?.firstName}><Input name="firstName" required /></Field>
                <Field id="inv-last" label={t("common.labels.lastName")} required error={state?.fieldErrors?.lastName}><Input name="lastName" required /></Field>
              </div>
              <Field id="inv-email" label={t("common.labels.email")} required error={state?.fieldErrors?.email}><Input name="email" type="email" required /></Field>
              <Field id="inv-role" label={t("account.users.role")}>
                <Select name="role" defaultValue="BUYER">{ROLES.map((r) => <option key={r} value={r}>{t.enum("account.users.roles", r)}</option>)}</Select>
              </Field>
            </DialogBody>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.actions.close")}</Button><Button type="submit" loading={pending}>{t("common.actions.send")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MemberRoleControls({ memberId, role, locked }: { memberId: string; role: string; locked: boolean }) {
  const t = useT();
  const toast = useToast();
  const [pending, start] = React.useTransition();
  if (locked) return <span className="text-sm text-muted">{t.enum("common.status.businessRole", role)}</span>;
  return (
    <div className="flex items-center gap-2">
      <Select value={role} disabled={pending} onChange={(e) => start(async () => toast.fromResult(await updateMemberRoleAction({ memberId, role: e.target.value as "ADMIN" })))} className="h-8 w-40 text-xs" aria-label={t("account.users.changeRole")}>
        {ROLES.map((r) => <option key={r} value={r}>{t.enum("common.status.businessRole", r)}</option>)}
      </Select>
      <Button size="icon-sm" variant="ghost" aria-label={t("account.users.remove")} disabled={pending} onClick={() => { if (window.confirm(t("account.users.removeConfirm"))) start(async () => { const r = await removeMemberAction({ memberId }); if (!r.ok) toast.error(r.error); }); }}><Trash2 /></Button>
    </div>
  );
}
