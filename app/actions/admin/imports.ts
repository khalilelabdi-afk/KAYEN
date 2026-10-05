"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { requireStaff, type ActionResult } from "@/lib/auth/dal";
import { slugify } from "@/lib/utils";
import { idSchema } from "@/lib/validation/common";
import { parseCsv, validateImport, type ImportRow, type ImportLineError } from "@/lib/catalog/import-csv";

const MAX_BYTES = 10 * 1024 * 1024;

export type ImportUploadState = { error?: string } | undefined;
/** Contenu JSON stocké dans CatalogImport.errors. */
export interface ImportStoredPayload { errors: ImportLineError[]; rows: ImportRow[] }

async function audit(userId: string, action: string, entityId: string, after?: unknown) {
  await db.auditLog.create({ data: { userId, action, entityType: "CatalogImport", entityId, after: after as Prisma.InputJsonValue } });
}

function decode(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder("utf-8").decode(buffer);
  return utf8.includes("�") ? new TextDecoder("windows-1252").decode(buffer) : utf8;
}

/** Étape 1 : téléverse, parse et valide le CSV ; crée l'enregistrement d'import puis redirige vers le rapport. */
export async function importUploadAction(_prev: ImportUploadState, formData: FormData): Promise<ImportUploadState> {
  const t = await getT();
  const user = await requireStaff();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: t("admin.products.import.noFile") };
  if (file.size > MAX_BYTES) return { error: t("admin.products.import.tooLarge") };
  const parsed = parseCsv(decode(await file.arrayBuffer()));
  if (parsed.header.length < 2) return { error: t("admin.products.import.invalidFile") };
  const [categories, brands, attributes] = await Promise.all([
    db.category.findMany({ select: { id: true, slug: true } }),
    db.brand.findMany({ select: { id: true, slug: true } }),
    db.attribute.findMany({ select: { id: true, code: true } }),
  ]);
  const result = validateImport(parsed, { categories: new Map(categories.map((c) => [c.slug, c.id])), brands: new Map(brands.map((b) => [b.slug, b.id])), attributes: new Map(attributes.map((a) => [a.code, a.id])) });
  const payload: ImportStoredPayload = { errors: result.errors, rows: result.rows };
  const record = await db.catalogImport.create({ data: { filename: file.name.slice(0, 200), status: result.rows.length ? "VALIDATED" : "FAILED", totalRows: result.totalRows, validRows: result.rows.length, errorRows: result.errors.length, errors: payload as unknown as Prisma.InputJsonValue, userId: user.id } });
  await audit(user.id, "import.validate", record.id, { filename: record.filename, validRows: record.validRows, errorRows: record.errorRows });
  revalidatePath("/admin/imports");
  redirect(`/admin/imports/${record.id}`);
}

async function uniqueSlug(tx: Prisma.TransactionClient, base: string): Promise<string> {
  let candidate = base;
  for (let i = 2; await tx.product.findUnique({ where: { slug: candidate }, select: { id: true } }); i++) candidate = `${base}-${i}`;
  return candidate;
}

/** Étape 2 : applique un import validé (produits, variante par défaut, stock, paliers, attributs) en une transaction. */
export async function importConfirmAction(input: { id: string }): Promise<ActionResult<{ count: number }>> {
  const t = await getT();
  const user = await requireStaff();
  const id = idSchema.safeParse(input?.id);
  if (!id.success) return { ok: false, error: t("common.errors.validation") };
  const record = await db.catalogImport.findUnique({ where: { id: id.data } });
  if (!record) return { ok: false, error: t("common.errors.notFound") };
  if (record.status !== "VALIDATED") return { ok: false, error: t("admin.products.import.alreadyImported") };
  const rows = (record.errors as unknown as ImportStoredPayload | null)?.rows ?? [];
  if (!rows.length) return { ok: false, error: t("admin.products.import.nothingToImport") };
  // Verrou optimiste : un seul appel peut faire passer l'import de VALIDATED à PENDING (évite un double import sur double clic).
  const claimed = await db.catalogImport.updateMany({ where: { id: record.id, status: "VALIDATED" }, data: { status: "PENDING" } });
  if (claimed.count === 0) return { ok: false, error: t("admin.products.import.alreadyImported") };
  const defaultTax = await db.taxClass.findFirst({ where: { isDefault: true }, select: { id: true } });
  try {
    const count = await db.$transaction(async (tx) => {
      let done = 0;
      for (const row of rows) {
        const existing = await tx.product.findFirst({ where: { sku: { equals: row.sku, mode: "insensitive" } }, select: { id: true } });
        const base = { name: row.name, categoryId: row.categoryId, brandId: row.brandId, shortDescription: row.shortDescription, description: row.description };
        const product = existing
          ? await tx.product.update({ where: { id: existing.id }, data: base })
          : await tx.product.create({ data: { ...base, sku: row.sku, slug: await uniqueSlug(tx, slugify(row.name) || row.sku.toLowerCase()), status: "ACTIVE", publishedAt: new Date(), taxClassId: defaultTax?.id ?? null, priceFrom: row.priceHt } });
        const existingVariant = await tx.productVariant.findFirst({ where: { sku: { equals: row.sku, mode: "insensitive" } }, select: { id: true, productId: true } });
        if (existingVariant && existingVariant.productId !== product.id) throw new Error(`variant_conflict:${row.sku}`);
        const hasDefault = existing ? !!(await tx.productVariant.findFirst({ where: { productId: product.id, isDefault: true, sku: { not: row.sku, mode: "insensitive" } }, select: { id: true } })) : false;
        const vdata = { basePrice: row.priceHt, moq: row.moq, orderMultiple: row.orderMultiple, unitLabel: row.unitLabel, packagingLabel: row.packagingLabel };
        const variant = existingVariant
          ? await tx.productVariant.update({ where: { id: existingVariant.id }, data: vdata })
          : await tx.productVariant.create({ data: { ...vdata, sku: row.sku, productId: product.id, isDefault: !hasDefault, isActive: true, position: 0 } });
        await tx.priceTier.deleteMany({ where: { variantId: variant.id } });
        if (row.tiers.length) await tx.priceTier.createMany({ data: row.tiers.map((tr) => ({ variantId: variant.id, minQuantity: tr.minQuantity, unitPrice: tr.unitPrice })) });
        const inv = await tx.inventory.findUnique({ where: { variantId: variant.id } });
        if (row.stock !== null) {
          const delta = row.stock - (inv?.quantity ?? 0);
          await tx.inventory.upsert({ where: { variantId: variant.id }, create: { variantId: variant.id, quantity: row.stock }, update: { quantity: row.stock } });
          if (delta !== 0) await tx.stockMovement.create({ data: { variantId: variant.id, type: "ADJUSTMENT", quantity: delta, referenceType: "import", referenceId: record.id, userId: user.id } });
        } else if (!inv) await tx.inventory.create({ data: { variantId: variant.id, quantity: 0 } });
        for (const a of row.attributes) {
          const numericValue = /^-?\d+([.,]\d+)?$/.test(a.value) ? Number(a.value.replace(",", ".")) : null;
          await tx.productAttributeValue.upsert({ where: { productId_attributeId: { productId: product.id, attributeId: a.attributeId } }, create: { productId: product.id, attributeId: a.attributeId, value: a.value, numericValue }, update: { value: a.value, numericValue } });
        }
        const agg = await tx.productVariant.aggregate({ where: { productId: product.id, isActive: true }, _min: { basePrice: true } });
        await tx.product.update({ where: { id: product.id }, data: { priceFrom: agg._min.basePrice ?? row.priceHt } });
        done++;
      }
      await tx.catalogImport.update({ where: { id: record.id }, data: { status: "COMPLETED" } });
      return done;
    }, { timeout: 300_000, maxWait: 10_000 });
    await audit(user.id, "import.apply", record.id, { filename: record.filename, count });
    for (const tag of ["products", "categories", "brands", "search"]) revalidateTag(tag, "max");
    for (const p of ["/admin/imports", `/admin/imports/${record.id}`, "/admin/products", "/admin/inventory"]) revalidatePath(p);
    return { ok: true, data: { count }, message: t("admin.products.import.done", { count }) };
  } catch (err) {
    console.error("[importConfirmAction]", err);
    await db.catalogImport.updateMany({ where: { id: record.id, status: "PENDING" }, data: { status: "VALIDATED" } }).catch(() => undefined);
    const sku = err instanceof Error && err.message.startsWith("variant_conflict:") ? err.message.slice("variant_conflict:".length) : null;
    return { ok: false, error: sku ? t("admin.products.form.variantSkuTaken", { sku }) : t("common.errors.generic") };
  }
}
