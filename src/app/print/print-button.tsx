"use client";

import { IconPrinter } from "@/components/icons";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-surface transition hover:bg-brand-strong active:scale-[0.98] print:hidden"
    >
      <IconPrinter className="h-4 w-4" />
      Print
    </button>
  );
}
