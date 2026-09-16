"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Polls the order status while a Pix charge is pending and refreshes the
 * server-rendered page automatically once the webhook confirms payment,
 * so the buyer doesn't have to click "atualizar" themselves. */
export default function PixStatusWatcher({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    if (status !== "aguardando_pagamento") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status !== statusRef.current) {
          router.refresh();
        }
      } catch {
        // network hiccup, try again on the next tick
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [orderId, status, router]);

  return null;
}
