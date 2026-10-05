import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { FilterBar, FilterSelect } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { MessageActions } from "@/components/admin/message-actions";

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const messages = await db.contactMessage.findMany({ where: { ...(sp.status ? { status: sp.status as "NEW" } : {}), ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: "insensitive" } }, { email: { contains: sp.q, mode: "insensitive" } }, { company: { contains: sp.q, mode: "insensitive" } }] } : {}) }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <AdminShell title={t("admin.cms.messages.title")}>
      <FilterBar searchValue={sp.q} searchPlaceholder={t("admin.table.search")} submitLabel={t("common.actions.filter")}>
        <FilterSelect name="status" value={sp.status} allLabel={t("admin.common.all")} label={t("admin.common.status")} options={["NEW", "IN_PROGRESS", "CLOSED"].map((s) => ({ value: s, label: t.enum("admin.cms.messages.statuses", s) }))} />
      </FilterBar>
      <ul className="space-y-3">
        {messages.map((m) => (
          <li key={m.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-semibold">{m.name}{m.company && <span className="font-normal text-muted"> · {m.company}</span>}</p><p className="text-xs text-muted">{m.email}{m.phone && ` · ${m.phone}`} · {formatDateTime(m.createdAt)} · {t.enum("cms.contact.form.subjects", m.subject)}</p></div>
              <StatusBadge status={m.status} label={t.enum("admin.cms.messages.statuses", m.status)} />
            </div>
            <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
            <div className="mt-3"><MessageActions id={m.id} status={m.status} email={m.email} subject={t.enum("cms.contact.form.subjects", m.subject)} /></div>
          </li>
        ))}
        {!messages.length && <li className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">{t("admin.table.noResults")}</li>}
      </ul>
    </AdminShell>
  );
}
