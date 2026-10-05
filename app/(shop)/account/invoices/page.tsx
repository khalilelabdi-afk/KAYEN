import type { Metadata } from "next";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { getT } from "@/i18n/server";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { AccountShell } from "@/components/account/account-shell";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.invoices.title"), robots: { index: false } };
}

export default async function InvoicesPage() {
  const [t, user] = await Promise.all([getT(), requireUser("/account/invoices")]);
  const invoices = user.business ? await db.invoice.findMany({ where: { businessId: user.business.id }, orderBy: { issuedAt: "desc" }, include: { order: { select: { id: true, number: true } } } }) : [];
  return (
    <AccountShell user={user} title={t("account.invoices.title")}>
      {invoices.length ? (
        <Table>
          <THead><TR><TH>{t("account.invoices.number")}</TH><TH>{t("account.invoices.date")}</TH><TH>{t("account.invoices.order")}</TH><TH>{t("account.invoices.due")}</TH><TH>{t("account.invoices.status")}</TH><TH className="text-end">{t("account.invoices.amount")}</TH><TH /></TR></THead>
          <TBody>
            {invoices.map((inv) => (
              <TR key={inv.id}>
                <TD className="font-semibold">{inv.number}</TD>
                <TD>{formatDate(inv.issuedAt)}</TD>
                <TD><Link href={`/account/orders/${inv.order.id}`} className="hover:underline">{inv.order.number}</Link></TD>
                <TD>{inv.dueAt ? formatDate(inv.dueAt) : "—"}</TD>
                <TD><StatusBadge status={inv.status} label={t.enum("common.status.invoice", inv.status)} /></TD>
                <TD className="text-end font-semibold tnum">{formatMoney(inv.total)}</TD>
                <TD className="text-end"><Button asChild size="sm" variant="outline"><Link href={`/account/invoices/${inv.id}`}>{t("account.invoices.download")}</Link></Button></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState icon={<Receipt />} title={t("account.invoices.empty")} />
      )}
    </AccountShell>
  );
}
