"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, ShoppingCart } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogHeading, DialogText } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { createListAction, renameListAction, deleteListAction, addListToCartAction, updateListItemAction, type FormState } from "@/app/actions/account";
import { QuantitySelector } from "@/components/ui/quantity-selector";

export function CreateListDialog() {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(createListAction, undefined);
  const [lastState, setLastState] = React.useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.success) setOpen(false);
  }
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus />{t("account.lists.create")}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm" closeLabel={t("common.actions.close")}>
          <form action={action}>
            <DialogHeader><DialogHeading>{t("account.lists.createTitle")}</DialogHeading><DialogText>{t("account.lists.desc")}</DialogText></DialogHeader>
            <DialogBody className="space-y-4">
              <FormError message={state?.error} />
              <Field id="list-name" label={t("account.lists.name")} required error={state?.fieldErrors?.name}><Input name="name" placeholder={t("account.lists.namePlaceholder")} required autoFocus /></Field>
              <Field id="list-desc" label={t("account.lists.description")} optionalLabel={t("common.labels.optional")}><Textarea name="description" rows={2} /></Field>
            </DialogBody>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.actions.cancel")}</Button><Button type="submit" loading={pending}>{t("common.actions.create")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ListHeaderActions({ listId, name, description, isDefault, itemCount }: { listId: string; name: string; description: string | null; isDefault: boolean; itemCount: number }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [newName, setNewName] = React.useState(name);
  const [newDesc, setNewDesc] = React.useState(description ?? "");
  const [pending, start] = React.useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" loading={pending} disabled={!itemCount} onClick={() => start(async () => { const r = await addListToCartAction({ listId }); if (r.ok) toast.success(r.message ?? "", { action: { label: t("cart.drawer.viewCart"), href: "/cart" } }); else toast.error(r.error); })}><ShoppingCart />{t("account.lists.addAll")}</Button>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Pencil />{t("account.lists.rename")}</Button>
      {!isDefault && <Button size="sm" variant="danger-outline" onClick={() => { if (window.confirm(t("account.lists.deleteConfirm"))) start(async () => { await deleteListAction({ listId }); router.push("/account/lists"); }); }}><Trash2 />{t("account.lists.delete")}</Button>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm" closeLabel={t("common.actions.close")}>
          <DialogHeader><DialogHeading>{t("account.lists.rename")}</DialogHeading></DialogHeader>
          <DialogBody className="space-y-3">
            <Field id="rename" label={t("account.lists.name")} required><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></Field>
            <Field id="rename-desc" label={t("account.lists.description")}><Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} /></Field>
          </DialogBody>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>{t("common.actions.cancel")}</Button><Button loading={pending} onClick={() => start(async () => { const r = await renameListAction({ listId, name: newName, description: newDesc }); if (r.ok) { toast.success(r.message ?? ""); setOpen(false); } else toast.error(r.error); })}>{t("common.actions.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ListItemQuantity({ listId, variantId, quantity, moq, step }: { listId: string; variantId: string; quantity: number; moq: number; step: number }) {
  const t = useT();
  const [value, setValue] = React.useState(quantity);
  const [pending, start] = React.useTransition();
  return (
    <QuantitySelector value={value} onChange={(q) => { setValue(q); start(async () => { await updateListItemAction({ listId, variantId, quantity: q }); }); }} moq={moq} step={step} size="sm" disabled={pending} labels={{ decrease: t("catalog.card.decrease"), increase: t("catalog.card.increase"), quantity: t("account.lists.usualQuantity") }} />
  );
}

export function RemoveListItem({ listId, variantId }: { listId: string; variantId: string }) {
  const t = useT();
  const [pending, start] = React.useTransition();
  return <Button variant="ghost" size="icon-sm" aria-label={t("account.lists.removeItem")} loading={pending} onClick={() => start(async () => { await updateListItemAction({ listId, variantId, quantity: 0 }); })}><Trash2 /></Button>;
}
