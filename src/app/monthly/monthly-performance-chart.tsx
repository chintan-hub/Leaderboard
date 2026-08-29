import { Card } from "@/components/ui";

interface Row {
  name: string;
  completed: number;
  returned: number;
}

/**
 * A deliberately simple grouped bar chart — two bars per employee, no axes,
 * no tooltips, no library. Just "who completed how much, who had returns,"
 * readable at a glance. Scrolls horizontally instead of shrinking bars past
 * legibility when there are many employees.
 */
export default function MonthlyPerformanceChart({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return null;

  const max = Math.max(1, ...rows.map((r) => Math.max(r.completed, r.returned)));
  const CHART_HEIGHT = 160;

  return (
    <Card>
      <div className="mb-4 flex items-center gap-4 text-xs font-semibold text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-positive" aria-hidden />
          Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-negative" aria-hidden />
          Returned
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex items-end gap-6" style={{ height: CHART_HEIGHT, minWidth: rows.length * 64 }}>
          {rows.map((row) => (
            <div key={row.name} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div className="flex h-full items-end gap-1">
                <div
                  className="w-4 rounded-t bg-positive"
                  style={{ height: `${(row.completed / max) * 100}%` }}
                  title={`${row.name}: ${row.completed} completed`}
                />
                <div
                  className="w-4 rounded-t bg-negative"
                  style={{ height: `${(row.returned / max) * 100}%` }}
                  title={`${row.name}: ${row.returned} returned`}
                />
              </div>
              <span className="max-w-[64px] truncate text-center text-[10px] font-semibold text-muted" title={row.name}>
                {row.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
