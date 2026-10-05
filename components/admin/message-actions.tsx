"use client";

import { useTransition } from "react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { contactStatusAction } from "@/app/actions/admin/sales";

export function MessageActions({ id, status, email, subject }: { id: string; status: string; email: string; subject: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button asChild size="sm" variant="outline"><a href={`mailto:${email}?subject=${encodeURIComponent(`Re: ${subject}`)}`}>{t("admin.cms.messages.reply")}</a></Button>
      {status === "NEW" && <Button size="sm" variant="ghost" loading={pending} onClick={() => start(async () => { await contactStatusAction({ id, status: "IN_PROGRESS" }); })}>{t("admin.cms.messages.markInProgress")}</Button>}
      {status !== "CLOSED" && <Button size="sm" variant="ghost" loading={pending} onClick={() => start(async () => { await contactStatusAction({ id, status: "CLOSED" }); })}>{t("admin.cms.messages.markClosed")}</Button>}
    </div>
  );
}
