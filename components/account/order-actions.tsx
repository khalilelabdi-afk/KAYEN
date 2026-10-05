"use client";

import { useTransition } from "react";
import { XCircle } from "lucide-react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cancelOrderAction } from "@/app/actions/account";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const t = useT();
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <Button variant="danger-outline" size="sm" loading={pending} onClick={() => { if (window.confirm(t("account.orders.detail.cancelConfirm"))) start(async () => toast.fromResult(await cancelOrderAction({ orderId }))); }}>
      <XCircle />{t("account.orders.detail.cancel")}
    </Button>
  );
}
