"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Silently re-fetches the display page every 2 minutes — subtle, no visible countdown or flicker. */
export default function AutoRefresh({ intervalMs = 120_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
