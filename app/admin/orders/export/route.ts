import { type NextRequest } from "next/server";
import { db, type Prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dal";

/** Export CSV des commandes (admin). */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.isStaff) return new Response("Forbidden", { status: 403 });
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const status = request.nextUrl.searchParams.get("status") ?? "";
  const where: Prisma.OrderWhereInput = { ...(status ? { status: status as "PENDING" } : {}), ...(q ? { OR: [{ number: { contains: q, mode: "insensitive" } }, { business: { name: { contains: q, mode: "insensitive" } } }] } : {}) };
  const orders = await db.order.findMany({ where, orderBy: { placedAt: "desc" }, take: 5000, include: { business: { select: { name: true } }, items: true } });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["Numéro", "Date", "Client", "Statut", "Paiement", "Méthode", "Sous-total HT", "Remise", "Livraison", "TVA", "Total TTC", "Articles", "Réf. BC"].join(";")];
  for (const o of orders) rows.push([o.number, o.placedAt.toISOString(), o.business.name, o.status, o.paymentStatus, o.paymentMethod, (o.subtotal / 100).toFixed(2), (o.discountTotal / 100).toFixed(2), (o.shippingTotal / 100).toFixed(2), (o.taxTotal / 100).toFixed(2), (o.total / 100).toFixed(2), o.items.map((i) => `${i.sku} x${i.quantity}`).join(" | "), o.poReference ?? ""].map(esc).join(";"));
  return new Response(`﻿${rows.join("\n")}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="commandes-kayen.csv"` } });
}
