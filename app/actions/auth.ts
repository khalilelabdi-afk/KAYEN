"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getT } from "@/i18n/server";
import { getCurrentUser, type ActionResult } from "@/lib/auth/dal";
import { createSession, destroySession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { fieldErrors, formDataToObject } from "@/lib/validation/common";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { authenticate, registerBusinessAccount, requestPasswordReset, resetPassword, resendVerification } from "@/services/auth";
import { mergeGuestCart } from "@/services/cart";

export type AuthState = { error?: string; fieldErrors?: Record<string, string[]>; success?: string; values?: Record<string, string> } | undefined;

async function clientKey(prefix: string) {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "local").split(",")[0]?.trim() ?? "local";
  return `${prefix}:${ip}`;
}

function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

function keepValues(raw: Record<string, unknown>, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) if (typeof raw[k] === "string") out[k] = raw[k] as string;
  return out;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  const raw = formDataToObject(formData);
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error), values: keepValues(raw, ["email"]) };
  const limit = await rateLimit(await clientKey("login"), 10, 15 * 60);
  if (!limit.ok) return { error: t("common.errors.rateLimited"), values: keepValues(raw, ["email"]) };
  const result = await authenticate(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.error === "inactive" ? t("common.errors.accountInactive") : t("common.errors.invalidCredentials"), values: keepValues(raw, ["email"]) };
  await createSession(result.userId);
  const user = await getCurrentUser();
  if (user) await mergeGuestCart(user);
  redirect(safeNext(parsed.data.next));
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  const raw = formDataToObject(formData);
  const values = keepValues(raw, ["firstName", "lastName", "email", "phone", "company", "sectorId", "activityLabel", "taxId", "line1", "postalCode", "city", "countryCode"]);
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = fieldErrors(parsed.error);
    const mapped: Record<string, string[]> = {};
    for (const [k, msgs] of Object.entries(fe)) {
      mapped[k] = msgs.map((m) => {
        if (m === "password_mismatch") return t("common.errors.passwordMismatch");
        if (m === "terms_required") return t("checkout.errors.termsRequired");
        if (k === "password") return t("common.errors.passwordTooShort", { min: 8 });
        if (k === "email") return t("common.errors.invalidEmail");
        if (k === "phone") return t("common.errors.invalidPhone");
        return t("common.errors.required");
      });
    }
    return { error: t("common.errors.validation"), fieldErrors: mapped, values };
  }
  const limit = await rateLimit(await clientKey("register"), 5, 60 * 60);
  if (!limit.ok) return { error: t("common.errors.rateLimited"), values };
  const result = await registerBusinessAccount({ ...parsed.data, phone: parsed.data.phone || undefined });
  if (!result.ok) return { error: t("common.errors.emailTaken"), fieldErrors: { email: [t("common.errors.emailTaken")] }, values };
  await createSession(result.userId);
  const user = await getCurrentUser();
  if (user) await mergeGuestCart(user);
  redirect("/register/success");
}

export async function forgotPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  const parsed = forgotPasswordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: t("common.errors.invalidEmail") };
  const limit = await rateLimit(await clientKey("forgot"), 5, 60 * 60);
  if (!limit.ok) return { error: t("common.errors.rateLimited") };
  await requestPasswordReset(parsed.data.email);
  return { success: t("auth.forgot.sent") };
}

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getT();
  const parsed = resetPasswordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const fe = fieldErrors(parsed.error);
    return { error: t("common.errors.validation"), fieldErrors: { password: fe.password ? [t("common.errors.passwordTooShort", { min: 8 })] : [], passwordConfirm: fe.passwordConfirm ? [t("common.errors.passwordMismatch")] : [] } };
  }
  const result = await resetPassword(parsed.data.token, parsed.data.password);
  if (!result.ok || !result.userId) return { error: t("auth.reset.invalid") };
  await createSession(result.userId);
  redirect("/account?reset=1");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function resendVerificationAction(): Promise<ActionResult> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("common.errors.unauthorized") };
  const limit = await rateLimit(`verify:${user.id}`, 3, 60 * 60);
  if (!limit.ok) return { ok: false, error: t("common.errors.rateLimited") };
  await resendVerification(user.id);
  return { ok: true, message: t("auth.verify.sent") };
}
