import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dal";

/** Listes d'achat de l'entreprise courante (pour le sélecteur "Ajouter à une liste"). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user?.business) return NextResponse.json({ lists: [], authenticated: !!user });
  const lists = await db.shoppingList.findMany({
    where: { businessId: user.business.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    select: { id: true, name: true, isDefault: true, _count: { select: { items: true } } },
  });
  return NextResponse.json({ authenticated: true, lists: lists.map((l) => ({ id: l.id, name: l.name, isDefault: l.isDefault, count: l._count.items })) });
}
