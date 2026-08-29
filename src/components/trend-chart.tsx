const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface TrendPoint {
  year: number;
  month: number;
  value: number;
}

/**
 * A simple zero-baseline trend chart — one bar per month, growing up from
 * center when positive and down when negative. No axes, no library; just
 * "is this person trending up or down" at a glance.
 */
export default function TrendChart({ points, label }: { points: TrendPoint[]; label: string }) {
  if (points.length === 0) return null;

  const max = Math.max(1, ...points.map((p) => Math.abs(p.value)));
  const HALF_HEIGHT = 70;

  return (
    <div className="overflow-x-auto">
      <div className="flex items-stretch gap-4" style={{ minWidth: points.length * 48 }}>
        {points.map((p) => (
          <div key={`${p.year}-${p.month}`} className="flex w-10 flex-col items-center">
            <div className="flex flex-col justify-end" style={{ height: HALF_HEIGHT }}>
              {p.value > 0 && (
                <div
                  className="w-4 self-center rounded-t bg-positive"
                  style={{ height: `${(p.value / max) * HALF_HEIGHT}px` }}
                  title={`${MONTH_ABBR[p.month - 1]} ${p.year}: ${p.value >= 0 ? "+" : ""}${p.value} ${label}`}
                />
              )}
            </div>
            <div className="h-px w-full bg-border" />
            <div className="flex flex-col justify-start" style={{ height: HALF_HEIGHT }}>
              {p.value < 0 && (
                <div
                  className="w-4 self-center rounded-b bg-negative"
                  style={{ height: `${(Math.abs(p.value) / max) * HALF_HEIGHT}px` }}
                  title={`${MONTH_ABBR[p.month - 1]} ${p.year}: ${p.value} ${label}`}
                />
              )}
            </div>
            <span className="mt-1 text-[10px] font-semibold text-muted">
              {MONTH_ABBR[p.month - 1]} {String(p.year).slice(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
