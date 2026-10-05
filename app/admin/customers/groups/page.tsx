import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard } from "@/components/admin/ui";
import { CustomerGroupForm } from "@/components/admin/customer-panels";

export default async function AdminGroupsPage() {
  const [t, groups] = await Promise.all([getT(), db.customerGroup.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { businesses: true } } } })]);
  return (
    <AdminShell title={t("admin.customers.groups.title")} breadcrumb={[{ label: t("admin.nav.customers"), href: "/admin/customers" }, { label: t("admin.customers.groups.title") }]}>
      <div className="space-y-4">
        {groups.map((g) => (
          <AdminCard key={g.id} title={`${g.name} · ${t("admin.customers.groups.members", { count: g._count.businesses })}`}><CustomerGroupForm group={g} /></AdminCard>
        ))}
        <AdminCard title={t("admin.customers.groups.create")}><CustomerGroupForm /></AdminCard>
      </div>
    </AdminShell>
  );
}
