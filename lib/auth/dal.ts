import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { PricingContext } from "@/lib/pricing/types";
import { getSession } from "./session";

export type BusinessRole = "OWNER" | "ADMIN" | "BUYER" | "VIEWER";
export type BusinessStatus = "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface CurrentBusiness {
  id: string;
  name: string;
  status: BusinessStatus;
  role: BusinessRole;
  customerGroupId: string | null;
  customerGroupName: string | null;
  groupDiscountBps: number;
  allowInvoicePay: boolean;
  invoiceTermDays: number;
  taxId: string | null;
  sectorId: string | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  locale: string;
  emailVerified: boolean;
  business: CurrentBusiness | null;
  isAdmin: boolean;
  isStaff: boolean;
}

/** Utilisateur courant (null si invité). DTO : uniquement ce dont l'UI a besoin. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;
  const u = session.user;
  const m = u.memberships[0] ?? null;
  const business: CurrentBusiness | null = m
    ? {
        id: m.business.id,
        name: m.business.name,
        status: m.business.status,
        role: m.role,
        customerGroupId: m.business.customerGroupId,
        customerGroupName: m.business.customerGroup?.name ?? null,
        groupDiscountBps: m.business.customerGroup?.discountBps ?? 0,
        allowInvoicePay: m.business.allowInvoicePay,
        invoiceTermDays: m.business.invoiceTermDays,
        taxId: m.business.taxId,
        sectorId: m.business.sectorId,
      }
    : null;
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    fullName: `${u.firstName} ${u.lastName}`.trim(),
    phone: u.phone,
    role: u.role,
    locale: u.locale,
    emailVerified: u.emailVerifiedAt !== null,
    business,
    isAdmin: u.role === "ADMIN",
    isStaff: u.role === "ADMIN" || u.role === "STAFF",
  };
});

/** Contexte de tarification pour le moteur de prix. */
export const getPricingContext = cache(async (): Promise<PricingContext> => {
  const user = await getCurrentUser();
  return {
    isAuthenticated: user !== null,
    businessId: user?.business?.id ?? null,
    customerGroupId: user?.business?.customerGroupId ?? null,
    groupDiscountBps: user?.business?.groupDiscountBps ?? 0,
    now: new Date(),
  };
});

export function loginUrl(next?: string) {
  return next ? `/login?next=${encodeURIComponent(next)}` : "/login";
}

/** Exige un utilisateur connecté (redirige sinon). */
export async function requireUser(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(next));
  return user;
}

/** Exige un utilisateur rattaché à une entreprise. */
export async function requireBusinessUser(next?: string): Promise<CurrentUser & { business: CurrentBusiness }> {
  const user = await requireUser(next);
  if (!user.business) redirect("/account/company?setup=1");
  return user as CurrentUser & { business: CurrentBusiness };
}

/** Exige un administrateur ou membre de l'équipe. */
export async function requireStaff(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(next ?? "/admin"));
  if (!user.isStaff) redirect("/account?forbidden=admin");
  return user;
}

export async function requireAdmin(next?: string): Promise<CurrentUser> {
  const user = await requireStaff(next);
  if (!user.isAdmin) redirect("/admin?forbidden=1");
  return user;
}

/** Vérifications de rôle entreprise (côté serveur uniquement). */
export function canOrder(user: CurrentUser | null): boolean {
  return !!user?.business && user.business.status === "APPROVED" && ["OWNER", "ADMIN", "BUYER"].includes(user.business.role);
}
export function canManageBusiness(user: CurrentUser | null): boolean {
  return !!user?.business && ["OWNER", "ADMIN"].includes(user.business.role);
}
export function isBusinessOwner(user: CurrentUser | null): boolean {
  return user?.business?.role === "OWNER";
}

/** Résultat standard des actions serveur. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
