"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Print and the TV display mode intentionally render with no nav, no
// max-width container, and none of the screen chrome — a print stylesheet
// fighting the app shell is fragile, so those routes just opt out entirely.
const CHROME_FREE_PREFIXES = ["/print", "/display"];

export default function ChromeGate({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const chromeFree = CHROME_FREE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (chromeFree) {
    return <>{children}</>;
  }

  return (
    <>
      {nav}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
