import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { FaqGroups } from "@/components/admin/faq-panels";

/** Catégories fixes de la FAQ publique (libellés dans cms.faq.categories). */
const FAQ_CATEGORIES = ["commande", "compte", "prix", "livraison", "devis", "paiement", "facturation", "retours", "disponibilite"];

export default async function AdminFaqPage() {
  const [t, faqs] = await Promise.all([getT(), db.faq.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] })]);
  return (
    <AdminShell title={`${t("admin.cms.faq.title")} (${faqs.length})`}>
      <FaqGroups faqs={faqs} categories={FAQ_CATEGORIES} />
    </AdminShell>
  );
}
