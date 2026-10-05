"use client";

import { useTransition, useState } from "react";
import { addToCartAction } from "@/app/actions/cart";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/i18n/client";
import { track } from "@/lib/analytics";

/** Hook partagé : ajoute au panier via l'action serveur, gère toast, analytics et état "ajouté". */
export function useAddToCart() {
  const [pending, start] = useTransition();
  const [justAdded, setJustAdded] = useState(false);
  const toast = useToast();
  const t = useT();

  const add = (input: { variantId: string; quantity: number; name: string; unitPrice: number; sku: string }, onDone?: () => void) =>
    start(async () => {
      const res = await addToCartAction({ variantId: input.variantId, quantity: input.quantity });
      if (res.ok) {
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1800);
        track({ name: "add_to_cart", params: { item_id: input.sku, item_name: input.name, quantity: res.data?.quantity ?? input.quantity, price: input.unitPrice / 100, currency: "EUR" } });
        toast.success(res.message ?? t("common.toasts.addedToCart"), { description: input.name, action: { label: t("cart.drawer.viewCart"), href: "/cart" } });
        onDone?.();
      } else {
        toast.error(res.error);
      }
    });

  return { add, pending, justAdded };
}
