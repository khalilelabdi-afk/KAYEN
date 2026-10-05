"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, Plus } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogHeading, DialogText } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioItem } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { addToListAction } from "@/app/actions/lists";
import { track } from "@/lib/analytics";

interface ListRow { id: string; name: string; isDefault: boolean; count: number }

export function AddToListButton({ variantId, quantity, sku, variant = "outline", size = "md", iconOnly = false, className }: { variantId: string; quantity: number; sku: string; variant?: "outline" | "ghost" | "secondary"; size?: "sm" | "md" | "lg" | "icon"; iconOnly?: boolean; className?: string }) {
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [lists, setLists] = React.useState<ListRow[] | null>(null);
  const [authenticated, setAuthenticated] = React.useState(true);
  const [selected, setSelected] = React.useState<string>("");
  const [newName, setNewName] = React.useState("");
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (!open) return;
    fetch("/api/lists")
      .then((r) => r.json())
      .then((d: { lists: ListRow[]; authenticated: boolean }) => {
        setLists(d.lists);
        setAuthenticated(d.authenticated);
        setSelected(d.lists[0]?.id ?? "__new");
      })
      .catch(() => setLists([]));
  }, [open]);

  const submit = () =>
    start(async () => {
      const res = await addToListAction({ variantId, quantity, listId: selected === "__new" ? "" : selected, newListName: selected === "__new" ? newName : "" });
      if (res.ok) {
        track({ name: "add_to_list", params: { item_id: sku, list_id: res.data?.listId } });
        toast.success(res.message ?? t("common.toasts.addedToList"), { description: res.data?.listName, action: { label: t("account.lists.view"), href: `/account/lists/${res.data?.listId}` } });
        setOpen(false);
      } else toast.error(res.error);
    });

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)} aria-label={iconOnly ? t("common.actions.addToList") : undefined} title={iconOnly ? t("common.actions.addToList") : undefined}>
        <Bookmark />
        {!iconOnly && t("common.actions.addToList")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm" closeLabel={t("common.actions.close")}>
          <DialogHeader>
            <DialogHeading>{t("common.actions.addToList")}</DialogHeading>
            <DialogText>{t("account.lists.desc")}</DialogText>
          </DialogHeader>
          <DialogBody>
            {lists === null ? (
              <p className="text-sm text-muted">{t("common.labels.loading")}</p>
            ) : !authenticated ? (
              <div className="space-y-3 text-sm">
                <p className="text-muted">{t("common.toasts.loginRequired")}</p>
                <Button asChild fullWidth><Link href="/login">{t("common.actions.login")}</Link></Button>
              </div>
            ) : (
              <RadioGroup value={selected} onValueChange={setSelected}>
                {lists.map((l) => (
                  <label key={l.id} htmlFor={`list-${l.id}`} className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2.5 has-[[data-state=checked]]:border-ink">
                    <RadioItem value={l.id} id={`list-${l.id}`} />
                    <span className="flex-1 text-sm font-medium">{l.name}</span>
                    <span className="text-xs text-muted">{t.plural("account.lists.itemsCount", l.count)}</span>
                  </label>
                ))}
                <label htmlFor="list-new" className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border-strong px-3 py-2.5 has-[[data-state=checked]]:border-ink">
                  <RadioItem value="__new" id="list-new" />
                  <Plus className="size-4 text-muted" aria-hidden />
                  <span className="flex-1 text-sm font-medium">{t("account.lists.newList")}</span>
                </label>
                {selected === "__new" && <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("account.lists.namePlaceholder")} aria-label={t("account.lists.name")} autoFocus />}
              </RadioGroup>
            )}
          </DialogBody>
          {authenticated && lists !== null && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t("common.actions.cancel")}</Button>
              <Button onClick={submit} loading={pending} disabled={selected === "__new" && !newName.trim()}>{t("common.actions.add")}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
