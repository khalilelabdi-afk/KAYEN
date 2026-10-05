import "server-only";
import type { Prisma } from "@/lib/db";

/** Numérotation lisible : KY-2026-000123 (commandes), DV- (devis), FA- (factures). Séquence par année. */
export async function nextNumber(tx: Prisma.TransactionClient, prefix: "KY" | "DV" | "FA"): Promise<string> {
  const year = new Date().getUTCFullYear();
  const key = `seq:${prefix}:${year}`;
  const rows = await tx.$queryRaw<{ value: number }[]>`
    INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES (${key}, '1'::jsonb, NOW())
    ON CONFLICT ("key") DO UPDATE SET "value" = (("Setting"."value")::int + 1)::text::jsonb, "updatedAt" = NOW()
    RETURNING ("value")::int AS value
  `;
  const n = rows[0]?.value ?? 1;
  return `${prefix}-${year}-${String(n).padStart(6, "0")}`;
}
