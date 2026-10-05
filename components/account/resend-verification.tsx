"use client";

import { useTransition } from "react";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { resendVerificationAction } from "@/app/actions/auth";

export function ResendVerification() {
  const t = useT();
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant="outline" loading={pending} onClick={() => start(async () => toast.fromResult(await resendVerificationAction()))}>{t("auth.verify.resend")}</Button>
  );
}
