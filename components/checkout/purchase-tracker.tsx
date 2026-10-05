"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function PurchaseTracker({ id, total, items }: { id: string; total: number; items: number }) {
  useEffect(() => {
    track({ name: "purchase", params: { transaction_id: id, value: total / 100, currency: "EUR", items } });
  }, [id, total, items]);
  return null;
}
