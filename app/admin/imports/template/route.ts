import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dal";
import { buildCsvTemplate } from "@/lib/catalog/import-csv";

/** Modèle CSV d'import catalogue (équipe uniquement). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isStaff) return new Response("Forbidden", { status: 403 });
  const attributes = await db.attribute.findMany({ orderBy: [{ sortOrder: "asc" }, { code: "asc" }], select: { code: true } });
  const csv = buildCsvTemplate(attributes.map((a) => a.code));
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="modele-import-kayen.csv"' } });
}
