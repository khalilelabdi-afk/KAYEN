import { getCurrentUser } from "@/lib/auth/dal";
import { storeUpload } from "@/lib/storage";

const MAX_BYTES = 10 * 1024 * 1024;

/** Téléversement d'une image produit (équipe uniquement). Retourne { url }. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.isStaff) return Response.json({ error: "forbidden" }, { status: 403 });
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "no_file" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
  if (!file.type.startsWith("image/")) return Response.json({ error: "unsupported_type" }, { status: 415 });
  try {
    const url = await storeUpload(file, "products");
    return Response.json({ url });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "upload_failed" }, { status: 400 });
  }
}
