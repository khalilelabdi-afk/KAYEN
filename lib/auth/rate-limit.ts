import "server-only";
import { db } from "@/lib/db";

/**
 * Limiteur de débit simple adossé à PostgreSQL (fenêtre fixe).
 * Suffisant pour protéger connexion, inscription, devis, contact, recherche.
 * Peut être remplacé par Redis sans changer les appelants.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  const bucket = await db.rateLimitBucket.upsert({
    where: { key },
    create: { key, count: 1, resetAt },
    update: {},
  });
  if (bucket.resetAt <= now) {
    await db.rateLimitBucket.update({ where: { key }, data: { count: 1, resetAt } });
    return { ok: true, remaining: limit - 1, resetAt };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }
  const updated = await db.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
  return { ok: updated.count <= limit, remaining: Math.max(0, limit - updated.count), resetAt: bucket.resetAt };
}

/** Nettoyage opportuniste des seaux expirés (appelé rarement). */
export async function pruneRateLimits() {
  await db.rateLimitBucket.deleteMany({ where: { resetAt: { lt: new Date() } } });
}
