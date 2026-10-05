import "server-only";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { siteConfig } from "@/lib/config/site";
import { sendEmail } from "@/lib/email";
import { welcomeEmail, verifyEmailEmail, passwordResetEmail, newBusinessAdminEmail, memberInviteEmail } from "@/emails";
import { getSettings } from "@/services/settings";

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  company: string;
  sectorId?: string;
  activityLabel?: string;
  taxId?: string;
  line1?: string;
  postalCode?: string;
  city?: string;
  countryCode: string;
}

export type RegisterResult = { ok: true; userId: string } | { ok: false; error: "email_taken" };

/** Inscription : utilisateur + entreprise (statut PENDING) + adhésion OWNER + liste favoris. */
export async function registerBusinessAccount(input: RegisterInput): Promise<RegisterResult> {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) return { ok: false, error: "email_taken" };
  const passwordHash = await hashPassword(input.password);
  const defaultGroup = await db.customerGroup.findFirst({ where: { isDefault: true } });
  const sector = input.sectorId ? await db.sector.findUnique({ where: { id: input.sectorId } }) : null;

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email: input.email, passwordHash, firstName: input.firstName, lastName: input.lastName, phone: input.phone || null },
    });
    const business = await tx.business.create({
      data: {
        name: input.company,
        sectorId: sector?.id ?? null,
        activityLabel: input.activityLabel || null,
        taxId: input.taxId || null,
        email: input.email,
        phone: input.phone || null,
        customerGroupId: defaultGroup?.id ?? null,
        members: { create: { userId: created.id, role: "OWNER" } },
        lists: { create: { userId: created.id, name: "Favoris", isDefault: true } },
        ...(input.line1 && input.postalCode && input.city
          ? { addresses: { create: { label: "Siège", company: input.company, line1: input.line1, postalCode: input.postalCode, city: input.city, countryCode: input.countryCode, isDefaultBilling: true, isDefaultShipping: true } } }
          : {}),
      },
    });
    await tx.auditLog.create({ data: { userId: created.id, action: "business.register", entityType: "Business", entityId: business.id, after: { name: business.name } } });
    return created;
  });

  const token = await createVerificationToken(user.id, "EMAIL_VERIFICATION", 24 * 60);
  const settings = await getSettings();
  await Promise.all([
    sendEmail(welcomeEmail({ firstName: user.firstName, company: input.company, email: user.email })),
    sendEmail(verifyEmailEmail({ firstName: user.firstName, email: user.email, url: `${siteConfig.url}/verify-email?token=${token}` })),
    sendEmail(newBusinessAdminEmail({ company: input.company, email: user.email, to: settings.salesEmail })),
  ]);
  return { ok: true, userId: user.id };
}

export type LoginResult = { ok: true; userId: string } | { ok: false; error: "invalid_credentials" | "inactive" };

export async function authenticate(email: string, password: string): Promise<LoginResult> {
  const user = await db.user.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash);
  if (!user || !valid) return { ok: false, error: "invalid_credentials" };
  if (!user.isActive) return { ok: false, error: "inactive" };
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { ok: true, userId: user.id };
}

export async function createVerificationToken(userId: string, type: "EMAIL_VERIFICATION" | "PASSWORD_RESET", ttlMinutes: number): Promise<string> {
  const token = generateToken();
  await db.verificationToken.deleteMany({ where: { userId, type, usedAt: null } });
  await db.verificationToken.create({ data: { userId, type, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttlMinutes * 60_000) } });
  return token;
}

export async function consumeToken(token: string, type: "EMAIL_VERIFICATION" | "PASSWORD_RESET"): Promise<{ userId: string } | null> {
  const row = await db.verificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) return null;
  await db.verificationToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  return { userId: row.userId };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return; // réponse identique pour ne pas révéler l'existence du compte
  const token = await createVerificationToken(user.id, "PASSWORD_RESET", 60);
  await sendEmail(passwordResetEmail({ firstName: user.firstName, email: user.email, url: `${siteConfig.url}/reset-password?token=${token}` }));
}

export async function resetPassword(token: string, password: string): Promise<{ ok: boolean; userId?: string }> {
  const consumed = await consumeToken(token, "PASSWORD_RESET");
  if (!consumed) return { ok: false };
  await db.user.update({ where: { id: consumed.userId }, data: { passwordHash: await hashPassword(password) } });
  await db.session.deleteMany({ where: { userId: consumed.userId } });
  return { ok: true, userId: consumed.userId };
}

export async function verifyEmail(token: string): Promise<boolean> {
  const consumed = await consumeToken(token, "EMAIL_VERIFICATION");
  if (!consumed) return false;
  await db.user.update({ where: { id: consumed.userId }, data: { emailVerifiedAt: new Date() } });
  return true;
}

export async function resendVerification(userId: string): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.emailVerifiedAt) return;
  const token = await createVerificationToken(user.id, "EMAIL_VERIFICATION", 24 * 60);
  await sendEmail(verifyEmailEmail({ firstName: user.firstName, email: user.email, url: `${siteConfig.url}/verify-email?token=${token}` }));
}

/** Invite un utilisateur dans une entreprise (création du compte sans mot de passe + lien de définition). */
export async function inviteMember(businessId: string, inviterName: string, input: { email: string; firstName: string; lastName: string; role: "ADMIN" | "BUYER" | "VIEWER" }): Promise<{ ok: true } | { ok: false; error: "already_member" }> {
  const business = await db.business.findUniqueOrThrow({ where: { id: businessId } });
  let user = await db.user.findUnique({ where: { email: input.email } });
  if (user) {
    const existing = await db.businessMember.findUnique({ where: { businessId_userId: { businessId, userId: user.id } } });
    if (existing) return { ok: false, error: "already_member" };
  } else {
    user = await db.user.create({ data: { email: input.email, firstName: input.firstName, lastName: input.lastName } });
  }
  await db.businessMember.create({ data: { businessId, userId: user.id, role: input.role } });
  const token = await createVerificationToken(user.id, "PASSWORD_RESET", 7 * 24 * 60);
  await sendEmail(memberInviteEmail({ firstName: user.firstName, email: user.email, company: business.name, inviter: inviterName, url: `${siteConfig.url}/reset-password?token=${token}&invite=1` }));
  return { ok: true };
}
