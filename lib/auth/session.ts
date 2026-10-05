import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/config/site";
import { generateToken, hashToken } from "./tokens";

export const SESSION_COOKIE = "kayen_session";
const SESSION_MAX_AGE = siteConfig.sessionDays * 24 * 60 * 60;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Crée une session en base et pose le cookie (à appeler depuis une action ou un route handler). */
export async function createSession(userId: string): Promise<void> {
  const token = generateToken();
  const h = await headers();
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
      userAgent: h.get("user-agent")?.slice(0, 255) ?? null,
      ip: (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim().slice(0, 64) || null,
    },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions(SESSION_MAX_AGE));
}

/** Supprime la session courante (base + cookie). */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.set(SESSION_COOKIE, "", cookieOptions(0));
}

/** Révoque toutes les sessions d'un utilisateur (changement de mot de passe, suspension). */
export async function revokeUserSessions(userId: string, exceptCurrent = false): Promise<void> {
  if (exceptCurrent) {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    const keep = token ? hashToken(token) : null;
    await db.session.deleteMany({ where: { userId, ...(keep ? { tokenHash: { not: keep } } : {}) } });
    return;
  }
  await db.session.deleteMany({ where: { userId } });
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof loadSession>>>["user"];

async function loadSession() {
  let token: string | undefined;
  try {
    const store = await cookies();
    token = store.get(SESSION_COOKIE)?.value;
  } catch {
    return null;
  }
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              business: { include: { customerGroup: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  if (!session) return null;
  if (session.expiresAt < new Date() || !session.user.isActive) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session;
}

/** Session courante, mémoïsée par requête (lecture seule, sans effet de bord cookie). */
export const getSession = cache(loadSession);
