import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { getT } from "@/i18n/server";
import { requireUser } from "@/lib/auth/dal";
import { listBusinessQuotes } from "@/services/quotes";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { AccountShell } from "@/components/account/account-shell";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.quotes.title"), robots: { index: false } };
}

export default async function QuotesPage() {
  const [t, user] = await Promise.all([getT(), requireUser("/account/quotes")]);
  const quotes = user.business ? await listBusinessQuotes(user.business.id) : [];
  return (
    <AccountShell user={user} title={t("account.quotes.title")} actions={<Button asChild size="sm"><Link href="/quote"><FileText />{t("common.actions.requestQuote")}</Link></Button>}>
      {quotes.length ? (
        <Table>
          <THead><TR><TH>{t("account.quotes.number")}</TH><TH>{t("account.quotes.date")}</TH><TH>{t("common.labels.items")}</TH><TH>{t("account.quotes.status")}</TH><TH className="text-end">{t("account.quotes.amount")}</TH><TH /></TR></THead>
          <TBody>
            {quotes.map((q) => (
              <TR key={q.id}>
                <TD><Link href={`/account/quotes/${q.id}`} className="font-semibold hover:underline">{q.number}</Link></TD>
                <TD>{formatDate(q.createdAt)}</TD>
                <TD className="tnum">{q._count.items}</TD>
                <TD><StatusBadge status={q.status} label={t.enum("common.status.quote", q.status)} />{q.validUntil && q.status === "QUOTED" && <span className="block text-xs text-muted">{t("account.quotes.validUntil", { date: formatDate(q.validUntil) })}</span>}</TD>
                <TD className="text-end font-semibold tnum">{q.quotedTotal !== null ? formatMoney(q.quotedTotal) : "—"}</TD>
                <TD className="text-end"><Button asChild size="sm" variant="ghost"><Link href={`/account/quotes/${q.id}`}>{t("account.quotes.view")}</Link></Button></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState icon={<FileText />} title={t("account.quotes.empty")} actions={<Button asChild><Link href="/quote">{t("account.quotes.emptyCta")}</Link></Button>} />
      )}
    </AccountShell>
  );
}
