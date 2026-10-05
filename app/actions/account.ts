"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { getCurrentUser, getPricingContext, canManageBusiness, requireUser, type ActionResult } from "@/lib/auth/dal";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { revokeUserSessions } from "@/lib/auth/session";
import { addressSchema, fieldErrors, formDataToObject, optionalText, emailSchema } from "@/lib/validation/common";
import { changePasswordSchema, profileSchema } from "@/lib/validation/auth";
import { reorder, cancelOrder, type ReorderResult } from "@/services/orders";
import { decideQuote } from "@/services/quotes";
import { addManyToCart } from "@/services/cart";
import { inviteMember } from "@/services/auth";

export type FormState = { error?: string; fieldErrors?: Record<string, string[]>; success?: string } | undefined;

// ── Commandes ──────────────────────────────────────────────────────────────
export async function reorderAction(input: { orderId: string }): Promise<ActionResult<ReorderResult>> {
  const t = await getT();
  const [user, ctx] = await Promise.all([getCurrentUser(), getPricingContext()]);
  if (!user?.business) return { ok: false, error: t("common.errors.unauthorized") };
  const result = await reorder(user, ctx, input.orderId);
  if (!result) return { ok: false, error: t("common.errors.notFound") };
  revalidatePath("/", "layout");
  return { ok: true, data: result, message: t.plural("account.orders.reorderResult.added", result.added.length) };
}

export async function cancelOrderAction(input: { orderId: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business) return { ok: false, error: t("common.errors.unauthorized") };
  const order = await db.order.findFirst({ where: { id: input.orderId, businessId: user.business.id } });
  if (!order) return { ok: false, error: t("common.errors.notFound") };
  if (!["PENDING", "CONFIRMED"].includes(order.status)) return { ok: false, error: t("common.errors.forbidden") };
  await cancelOrder(order.id, user.id, "Annulée par le client");
  revalidatePath(`/account/orders/${order.id}`);
  revalidatePath("/account/orders");
  return { ok: true, message: t("account.orders.detail.cancelled") };
}

// ── Devis ──────────────────────────────────────────────────────────────────
export async function decideQuoteAction(input: { quoteId: string; decision: "ACCEPTED" | "REJECTED"; note?: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business) return { ok: false, error: t("common.errors.unauthorized") };
  const res = await decideQuote(user.business.id, input.quoteId, input.decision, input.note);
  if (!res) return { ok: false, error: t("account.quotes.detail.expired") };
  revalidatePath(`/account/quotes/${input.quoteId}`);
  revalidatePath("/account/quotes");
  return { ok: true, message: input.decision === "ACCEPTED" ? t("account.quotes.detail.accepted") : t("account.quotes.detail.rejected") };
}

// ── Listes ─────────────────────────────────────────────────────────────────
export async function createListAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business) return { error: t("common.errors.unauthorized") };
  const parsed = z.object({ name: z.string().trim().min(1).max(80), description: optionalText(300) }).safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: t("common.errors.required"), fieldErrors: { name: [t("common.errors.required")] } };
  await db.shoppingList.create({ data: { businessId: user.business.id, userId: user.id, name: parsed.data.name, description: parsed.data.description || null } });
  revalidatePath("/account/lists");
  return { success: t("common.toasts.listSaved") };
}

export async function renameListAction(input: { listId: string; name: string; description?: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business) return { ok: false, error: t("common.errors.unauthorized") };
  const name = input.name.trim().slice(0, 80);
  if (!name) return { ok: false, error: t("common.errors.required") };
  const res = await db.shoppingList.updateMany({ where: { id: input.listId, businessId: user.business.id }, data: { name, description: input.description?.trim() || null } });
  if (!res.count) return { ok: false, error: t("common.errors.notFound") };
  revalidatePath("/account/lists", "layout");
  return { ok: true, message: t("account.lists.updated") };
}

export async function deleteListAction(input: { listId: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business) return { ok: false, error: t("common.errors.unauthorized") };
  await db.shoppingList.deleteMany({ where: { id: input.listId, businessId: user.business.id, isDefault: false } });
  revalidatePath("/account/lists", "layout");
  return { ok: true };
}

export async function updateListItemAction(input: { listId: string; variantId: string; quantity: number; note?: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business) return { ok: false, error: t("common.errors.unauthorized") };
  const list = await db.shoppingList.findFirst({ where: { id: input.listId, businessId: user.business.id } });
  if (!list) return { ok: false, error: t("common.errors.notFound") };
  const parsed = z.object({ quantity: z.coerce.number().int().min(0).max(1_000_000) }).safeParse({ quantity: input.quantity });
  if (!parsed.success) return { ok: false, error: t("common.errors.invalidQuantity") };
  if (parsed.data.quantity === 0) {
    await db.listItem.deleteMany({ where: { listId: list.id, variantId: input.variantId } });
  } else {
    await db.listItem.updateMany({ where: { listId: list.id, variantId: input.variantId }, data: { quantity: parsed.data.quantity, ...(input.note !== undefined ? { note: input.note.slice(0, 200) || null } : {}) } });
  }
  revalidatePath(`/account/lists/${list.id}`);
  return { ok: true };
}

export async function addListToCartAction(input: { listId: string; variantIds?: string[] }): Promise<ActionResult<{ added: number; failed: number }>> {
  const t = await getT();
  const [user, ctx] = await Promise.all([getCurrentUser(), getPricingContext()]);
  if (!user?.business) return { ok: false, error: t("common.errors.unauthorized") };
  const list = await db.shoppingList.findFirst({ where: { id: input.listId, businessId: user.business.id }, include: { items: true } });
  if (!list) return { ok: false, error: t("common.errors.notFound") };
  const items = list.items.filter((i) => !input.variantIds || input.variantIds.includes(i.variantId)).map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
  const results = await addManyToCart(user, ctx, items);
  const added = results.filter((r) => r.ok).length;
  revalidatePath("/", "layout");
  return { ok: true, data: { added, failed: results.length - added }, message: t("account.lists.addedToCart", { count: added }) };
}

// ── Adresses ───────────────────────────────────────────────────────────────
export async function saveAddressAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business || !canManageBusiness(user)) return { error: t("common.errors.forbidden") };
  const raw = formDataToObject(formData);
  const parsed = addressSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = fieldErrors(parsed.error);
    return { error: t("common.errors.validation"), fieldErrors: Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v.map(() => (k === "phone" ? t("common.errors.invalidPhone") : t("common.errors.required")))])) };
  }
  const d = parsed.data;
  const data = { label: d.label || null, type: d.type, company: d.company || null, firstName: d.firstName || null, lastName: d.lastName || null, line1: d.line1, line2: d.line2 || null, postalCode: d.postalCode, city: d.city, region: d.region || null, countryCode: d.countryCode, phone: d.phone || null, instructions: d.instructions || null, isDefaultBilling: !!d.isDefaultBilling, isDefaultShipping: !!d.isDefaultShipping };
  const id = typeof raw.id === "string" ? raw.id : "";
  await db.$transaction(async (tx) => {
    if (data.isDefaultBilling) await tx.address.updateMany({ where: { businessId: user.business!.id }, data: { isDefaultBilling: false } });
    if (data.isDefaultShipping) await tx.address.updateMany({ where: { businessId: user.business!.id }, data: { isDefaultShipping: false } });
    if (id) await tx.address.updateMany({ where: { id, businessId: user.business!.id }, data });
    else await tx.address.create({ data: { ...data, businessId: user.business!.id } });
  });
  revalidatePath("/account/addresses");
  return { success: t("account.addresses.saved") };
}

export async function deleteAddressAction(input: { id: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business || !canManageBusiness(user)) return { ok: false, error: t("common.errors.forbidden") };
  await db.address.deleteMany({ where: { id: input.id, businessId: user.business.id } });
  revalidatePath("/account/addresses");
  return { ok: true, message: t("account.addresses.deleted") };
}

export async function setDefaultAddressAction(input: { id: string; kind: "billing" | "shipping" }): Promise<ActionResult> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business || !canManageBusiness(user)) return { ok: false, error: t("common.errors.forbidden") };
  const field = input.kind === "billing" ? "isDefaultBilling" : "isDefaultShipping";
  await db.$transaction([
    db.address.updateMany({ where: { businessId: user.business.id }, data: { [field]: false } }),
    db.address.updateMany({ where: { id: input.id, businessId: user.business.id }, data: { [field]: true } }),
  ]);
  revalidatePath("/account/addresses");
  return { ok: true, message: t("common.toasts.addressUpdated") };
}

// ── Utilisateurs ───────────────────────────────────────────────────────────
export async function inviteUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business || !canManageBusiness(user)) return { error: t("common.errors.forbidden") };
  const parsed = z.object({ email: emailSchema, firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), role: z.enum(["ADMIN", "BUYER", "VIEWER"]) }).safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  const res = await inviteMember(user.business.id, user.fullName, parsed.data);
  if (!res.ok) return { error: t("account.users.alreadyMember") };
  revalidatePath("/account/users");
  return { success: t("account.users.invited") };
}

export async function updateMemberRoleAction(input: { memberId: string; role: "ADMIN" | "BUYER" | "VIEWER" }): Promise<ActionResult> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business || !canManageBusiness(user)) return { ok: false, error: t("common.errors.forbidden") };
  const member = await db.businessMember.findFirst({ where: { id: input.memberId, businessId: user.business.id } });
  if (!member) return { ok: false, error: t("common.errors.notFound") };
  if (member.role === "OWNER" || member.userId === user.id) return { ok: false, error: t("account.users.onlyOwner") };
  await db.businessMember.update({ where: { id: member.id }, data: { role: input.role } });
  revalidatePath("/account/users");
  return { ok: true, message: t("common.toasts.saved") };
}

export async function removeMemberAction(input: { memberId: string }): Promise<ActionResult> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business || !canManageBusiness(user)) return { ok: false, error: t("common.errors.forbidden") };
  const member = await db.businessMember.findFirst({ where: { id: input.memberId, businessId: user.business.id } });
  if (!member || member.role === "OWNER" || member.userId === user.id) return { ok: false, error: t("common.errors.forbidden") };
  await db.businessMember.delete({ where: { id: member.id } });
  await revokeUserSessions(member.userId);
  revalidatePath("/account/users");
  return { ok: true };
}

// ── Entreprise ─────────────────────────────────────────────────────────────
export async function updateCompanyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business || !canManageBusiness(user)) return { error: t("common.errors.forbidden") };
  const parsed = z.object({ name: z.string().trim().min(2).max(120), legalName: optionalText(160), taxId: optionalText(40), registrationNumber: optionalText(40), sectorId: optionalText(64), phone: optionalText(30), email: emailSchema.optional().or(z.literal("")), website: optionalText(200) }).safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const before = await db.business.findUnique({ where: { id: user.business.id } });
  await db.business.update({ where: { id: user.business.id }, data: { name: d.name, legalName: d.legalName || null, taxId: d.taxId || null, registrationNumber: d.registrationNumber || null, sectorId: d.sectorId || null, phone: d.phone || null, email: d.email || null, website: d.website || null } });
  await db.auditLog.create({ data: { userId: user.id, action: "business.update", entityType: "Business", entityId: user.business.id, before: { name: before?.name, taxId: before?.taxId }, after: { name: d.name, taxId: d.taxId } } });
  revalidatePath("/account", "layout");
  return { success: t("account.company.saved") };
}

// ── Paramètres ─────────────────────────────────────────────────────────────
export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const user = await requireUser();
  const parsed = profileSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  await db.user.update({ where: { id: user.id }, data: { firstName: parsed.data.firstName, lastName: parsed.data.lastName, phone: parsed.data.phone || null, ...(parsed.data.locale ? { locale: parsed.data.locale } : {}) } });
  revalidatePath("/", "layout");
  return { success: t("account.settings.profileSaved") };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: t("common.errors.validation"), fieldErrors: { passwordConfirm: [t("common.errors.passwordMismatch")] } };
  const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(parsed.data.currentPassword, row.passwordHash))) return { error: t("common.errors.invalidCredentials"), fieldErrors: { currentPassword: [t("common.errors.invalidCredentials")] } };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  await revokeUserSessions(user.id, true);
  return { success: t("account.settings.passwordChanged") };
}
