import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { requireUser, canManageBusiness } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { AccountShell } from "@/components/account/account-shell";
import { Badge } from "@/components/ui/badge";
import { InviteUserDialog, MemberRoleControls } from "@/components/account/user-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.users.title"), robots: { index: false } };
}

export default async function UsersPage() {
  const [t, user] = await Promise.all([getT(), requireUser("/account/users")]);
  const canManage = canManageBusiness(user);
  const members = user.business ? await db.businessMember.findMany({ where: { businessId: user.business.id }, include: { user: true }, orderBy: { createdAt: "asc" } }) : [];
  return (
    <AccountShell user={user} title={t("account.users.title")} actions={canManage ? <InviteUserDialog /> : undefined}>
      <p className="mb-6 text-sm text-muted">{t("account.users.desc")}</p>
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{m.user.firstName.charAt(0)}{m.user.lastName.charAt(0)}</span>
              <div><p className="text-sm font-medium">{m.user.firstName} {m.user.lastName}{m.userId === user.id && <Badge variant="soft" className="ms-2">{t("account.users.you")}</Badge>}{!m.user.passwordHash && <Badge variant="warning" className="ms-2">{t("account.users.invited")}</Badge>}</p><p className="text-xs text-muted">{m.user.email} · {formatDate(m.createdAt)}</p></div>
            </div>
            <MemberRoleControls memberId={m.id} role={m.role} locked={!canManage || m.role === "OWNER" || m.userId === user.id} />
          </li>
        ))}
      </ul>
      <div className="mt-6 rounded-lg border border-border bg-paper p-4 text-xs text-muted">
        {(["OWNER", "ADMIN", "BUYER", "VIEWER"] as const).map((r) => <p key={r}>{t.enum("account.users.roles", r)}</p>)}
      </div>
    </AccountShell>
  );
}
