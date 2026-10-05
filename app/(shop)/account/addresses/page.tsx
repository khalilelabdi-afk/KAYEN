import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { getT } from "@/i18n/server";
import { requireUser, canManageBusiness } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { AccountShell } from "@/components/account/account-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { AddressDialog, AddressCardActions } from "@/components/account/address-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.addresses.title"), robots: { index: false } };
}

export default async function AddressesPage() {
  const [t, user] = await Promise.all([getT(), requireUser("/account/addresses")]);
  const canManage = canManageBusiness(user);
  const addresses = user.business ? await db.address.findMany({ where: { businessId: user.business.id }, orderBy: [{ isDefaultBilling: "desc" }, { isDefaultShipping: "desc" }, { createdAt: "asc" }] }) : [];
  return (
    <AccountShell user={user} title={t("account.addresses.title")} actions={canManage ? <AddressDialog /> : undefined}>
      <p className="mb-6 text-sm text-muted">{t("account.addresses.desc")}</p>
      {addresses.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-lg border border-border bg-surface p-4 text-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="font-semibold">{a.label ?? a.company ?? a.line1}</p>
                {a.isDefaultBilling && <Badge variant="soft">{t("account.addresses.defaultBilling")}</Badge>}
                {a.isDefaultShipping && <Badge variant="soft">{t("account.addresses.defaultShipping")}</Badge>}
              </div>
              <p className="mt-2 text-muted">{a.company && <>{a.company}<br /></>}{[a.firstName, a.lastName].filter(Boolean).join(" ")}{(a.firstName || a.lastName) && <br />}{a.line1}{a.line2 && <>, {a.line2}</>}<br />{a.postalCode} {a.city}, {a.countryCode}{a.phone && <><br />{a.phone}</>}</p>
              {a.instructions && <p className="mt-1 text-xs text-subtle">{a.instructions}</p>}
              {canManage && <AddressCardActions address={a} />}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<MapPin />} title={t("account.addresses.empty")} actions={canManage ? <AddressDialog /> : undefined} />
      )}
    </AccountShell>
  );
}
