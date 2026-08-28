import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(33,28,23,0.04),0_8px_20px_-14px_rgba(33,28,23,0.25)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  subtitle,
  eyebrow,
  action,
}: {
  children: ReactNode;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-brand">{eyebrow}</p>
        )}
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">{children}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function BigNumber({
  value,
  label,
  tone = "neutral",
}: {
  value: number | string;
  label: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-foreground";
  return (
    <div>
      <div className={`score-lg text-3xl ${toneClass}`}>{value}</div>
      <div className="text-xs font-bold uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white/60 px-6 py-10 text-center">
      <p className="font-bold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-lg bg-negative-tint px-3 py-2 text-sm font-medium text-negative">
      {message}
    </p>
  );
}

const BADGE_TONES = {
  brand: "bg-brand-tint text-brand",
  positive: "bg-positive-tint text-positive",
  negative: "bg-negative-tint text-negative",
  info: "bg-info-tint text-info",
  neutral: "bg-silver-tint text-silver",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof BADGE_TONES;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Circular rank indicator. Ranks 1-3 get a dedicated gold/silver/bronze
 * treatment (the only place those colors appear) — everything else is a
 * quiet neutral numeral, so the top of the board reads instantly without
 * turning the whole list into a rainbow.
 */
export function RankBadge({ rank, size = "md" }: { rank: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass =
    size === "lg" ? "h-14 w-14 text-2xl" : size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";

  const toneClass =
    rank === 1
      ? "bg-gold text-white shadow-[0_4px_10px_-2px_rgba(180,83,9,0.5)]"
      : rank === 2
        ? "bg-silver text-white shadow-[0_4px_10px_-2px_rgba(82,82,91,0.35)]"
        : rank === 3
          ? "bg-bronze text-white shadow-[0_4px_10px_-2px_rgba(154,91,46,0.4)]"
          : "bg-silver-tint text-muted";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-black ${sizeClass} ${toneClass}`}
    >
      {rank}
    </span>
  );
}

/**
 * The one place the Completed / Rework / Net / Manual / Final breakdown is
 * rendered, reused by the dashboard leaderboard, employee detail, and the
 * print layout — so "never hide the calculation" stays visually consistent
 * everywhere instead of being re-implemented per screen.
 */
export function ScoreBreakdown({
  completed,
  rework,
  manual,
  final,
  size = "md",
}: {
  completed: number;
  rework: number;
  manual: number;
  final: number;
  size?: "sm" | "md";
}) {
  const numberClass = size === "sm" ? "text-base font-bold" : "text-lg font-extrabold";
  return (
    <div className="flex items-center gap-4 text-right">
      <div>
        <div className={`${numberClass} tabular-nums text-foreground`}>{completed}</div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Completed</div>
      </div>
      <div>
        <div className={`${numberClass} tabular-nums ${rework > 0 ? "text-negative" : "text-foreground"}`}>
          {rework}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Returned</div>
      </div>
      <div>
        <div className={`${numberClass} tabular-nums ${manual > 0 ? "text-positive" : manual < 0 ? "text-negative" : "text-foreground"}`}>
          {manual >= 0 ? "+" : ""}
          {manual}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Manual</div>
      </div>
      <div>
        <div className={`score-md text-xl text-brand`}>{final}</div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Final</div>
      </div>
    </div>
  );
}

/** Rank movement arrow. Only render when the caller has a reliable comparison — never invent movement. */
export function MovementIndicator({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="inline-block w-8 text-center text-muted">—</span>;
  if (delta === 0) return <span className="inline-block w-8 text-center text-muted">—</span>;
  const up = delta > 0;
  return (
    <span
      className={`inline-flex w-8 items-center justify-center gap-0.5 text-xs font-bold ${
        up ? "text-positive" : "text-negative"
      }`}
    >
      {up ? "▲" : "▼"}
      {Math.abs(delta)}
    </span>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
