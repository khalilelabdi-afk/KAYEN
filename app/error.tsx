"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-site py-16 md:py-24">
      <div className="mx-auto max-w-lg text-center">
        <p className="t-label text-muted">500</p>
        <h1 className="t-h1 mt-3">{t("cms.error.title")}</h1>
        <p className="mt-4 text-muted">{t("cms.error.desc")}</p>
        {error.digest && <p className="mt-2 text-xs text-subtle">{t("cms.error.reference", { digest: error.digest })}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => retry()}>{t("cms.error.retry")}</Button>
          <Button asChild variant="outline">
            <Link href="/">{t("cms.error.home")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
