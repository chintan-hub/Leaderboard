"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="focus-ring rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-surface transition hover:bg-brand-strong active:scale-[0.98] print:hidden"
    >
      🖨 Print
    </button>
  );
}
