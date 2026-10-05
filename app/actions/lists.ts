"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, type ActionResult } from "@/lib/auth/dal";
import { getT } from "@/i18n/server";
import { idSchema, quantitySchema } from "@/lib/validation/common";

const addSchema = z.object({
  variantId: idSchema,
  quantity: quantitySchema.default(1),
  listId: idSchema.optional().or(z.literal("")),
  newListName: z.string().trim().min(1).max(80).optional().or(z.literal("")),
});

/** Ajoute une variante à une liste (existante ou nouvelle). Réservé aux comptes rattachés à une entreprise. */
export async function addToListAction(input: { variantId: string; quantity?: number; listId?: string; newListName?: string }): Promise<ActionResult<{ listId: string; listName: string }>> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business) return { ok: false, error: t("common.toasts.loginRequired") };
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.errors.validation") };
  const { variantId, quantity } = parsed.data;
  const businessId = user.business.id;

  let list = parsed.data.listId ? await db.shoppingList.findFirst({ where: { id: parsed.data.listId, businessId } }) : null;
  if (!list && parsed.data.newListName) {
    list = await db.shoppingList.create({ data: { businessId, userId: user.id, name: parsed.data.newListName } });
  }
  if (!list) {
    list = await db.shoppingList.findFirst({ where: { businessId, isDefault: true } });
    if (!list) list = await db.shoppingList.create({ data: { businessId, userId: user.id, name: t("account.lists.favorites"), isDefault: true } });
  }
  const variant = await db.productVariant.findFirst({ where: { id: variantId, isActive: true } });
  if (!variant) return { ok: false, error: t("common.errors.productUnavailable") };
  await db.listItem.upsert({
    where: { listId_variantId: { listId: list.id, variantId } },
    create: { listId: list.id, variantId, quantity },
    update: { quantity },
  });
  revalidatePath("/account/lists", "layout");
  return { ok: true, data: { listId: list.id, listName: list.name }, message: t("common.toasts.addedToList") };
}
