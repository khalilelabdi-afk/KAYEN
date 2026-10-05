import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Stockage de fichiers (images produits, pièces jointes de devis).
 * Provider "local" (public/uploads) par défaut ; "s3" via variables d'environnement.
 */
const ALLOWED = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".xlsx", ".xls", ".csv", ".doc", ".docx"]);

export async function storeUpload(file: File, folder: string): Promise<string> {
  const ext = extname(file.name).toLowerCase() || ".bin";
  if (!ALLOWED.has(ext)) throw new Error("Type de fichier non autorisé");
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  if (process.env.STORAGE_PROVIDER === "s3" && process.env.S3_BUCKET) {
    return storeS3(buffer, `${folder}/${name}`, file.type);
  }
  const dir = join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), buffer);
  return `/uploads/${folder}/${name}`;
}

async function storeS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  // Implémentation volontairement minimale (PUT pré-signé côté serveur via SDK à brancher).
  // Pour éviter une dépendance lourde tant que S3 n'est pas utilisé, on échoue explicitement.
  void buffer;
  void contentType;
  throw new Error(`Stockage S3 non configuré pour ${key} : installez @aws-sdk/client-s3 et complétez lib/storage.ts`);
}
