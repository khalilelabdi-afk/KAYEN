"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { decideQuoteAction } from "@/app/actions/account";

export function QuoteDecision({ quoteId }: { quoteId: string }) {
  const t = useT();
  const toast = useToast();
  const [pending, start] = useTransition();
  const decide = (decision: "ACCEPTED" | "REJECTED") => {
    if (decision === "ACCEPTED" && !window.confirm(t("account.quotes.detail.acceptConfirm"))) return;
    start(async () => toast.fromResult(await decideQuoteAction({ quoteId, decision })));
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="accent" loading={pending} onClick={() => decide("ACCEPTED")}><Check />{t("account.quotes.detail.accept")}</Button>
      <Button variant="outline" disabled={pending} onClick={() => decide("REJECTED")}><X />{t("account.quotes.detail.reject")}</Button>
    </div>
  );
}
