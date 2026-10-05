import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, ArrowRight } from "lucide-react";
import { getT } from "@/i18n/server";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { AccountShell } from "@/components/account/account-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateListDialog } from "@/components/account/list-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.lists.title"), robots: { index: false } };
}

export default async function ListsPage() {
  const [t, user] = await Promise.all([getT(), requireUser("/account/lists")]);
  const lists = user.business ? await db.shoppingList.findMany({ where: { businessId: user.business.id }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }], include: { _count: { select: { items: true } } } }) : [];
  return (
    <AccountShell user={user} title={t("account.lists.title")} actions={<CreateListDialog />}>
      <p className="mb-6 text-sm text-muted">{t("account.lists.desc")}</p>
      {lists.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {lists.map((l) => (
            <li key={l.id}>
              <Link href={`/account/lists/${l.id}`} className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-ink">
                <span className="min-w-0"><span className="block truncate font-semibold">{l.name}</span><span className="block text-xs text-muted">{t.plural("account.lists.itemsCount", l._count.items)} · {formatDate(l.updatedAt)}</span>{l.description && <span className="mt-1 line-clamp-1 block text-xs text-muted">{l.description}</span>}</span>
                <ArrowRight className="size-4 shrink-0 text-subtle group-hover:text-accent rtl:rotate-180" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<ListChecks />} title={t("account.lists.empty")} description={t("account.lists.desc")} actions={<CreateListDialog />} />
      )}
    </AccountShell>
  );
}
