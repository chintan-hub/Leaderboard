import Link from "next/link";
import type { EmployeeLeaderboardRow } from "@/lib/queries";
import { Card, EmptyState, MovementIndicator, RankBadge } from "@/components/ui";

export function EmployeeLeaderboardPanel({
  rows,
  showTopThree = true,
  emptyAction,
}: {
  rows: EmployeeLeaderboardRow[];
  showTopThree?: boolean;
  emptyAction?: React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No employees yet"
        description="Add employees under a department to start tracking points."
        action={emptyAction}
      />
    );
  }

  const topThree = showTopThree ? rows.slice(0, 3) : [];

  return (
    <div className="space-y-4">
      {topThree.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {topThree.map((row) => (
            <Card
              key={row.employeeId}
              raised
              className={
                row.rank === 1
                  ? "border-gold/40 bg-gold-tint"
                  : row.rank === 2
                    ? "border-silver/30 bg-silver-tint"
                    : "border-bronze/30 bg-bronze-tint"
              }
            >
              <div className="flex items-center gap-3">
                <RankBadge rank={row.rank} />
                <div className="min-w-0">
                  <Link
                    href={`/employees/${row.employeeId}`}
                    className="focus-ring block truncate rounded font-extrabold text-foreground hover:underline"
                  >
                    {row.name}
                  </Link>
                  <div className="truncate text-xs font-semibold text-muted">{row.departmentName}</div>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-xs text-muted">
                  {row.summary.recognitionCount} recognition{row.summary.recognitionCount === 1 ? "" : "s"} ·{" "}
                  {row.summary.deductionCount} deduction{row.summary.deductionCount === 1 ? "" : "s"}
                </span>
                <span className="score-lg text-2xl text-foreground">
                  {row.summary.netPoints >= 0 ? "+" : ""}
                  {row.summary.netPoints}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-0">
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li
              key={row.employeeId}
              className="list-row flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <RankBadge rank={row.rank} size="sm" />
                <MovementIndicator delta={row.movement?.delta ?? null} />
                <div className="min-w-0">
                  <Link
                    href={`/employees/${row.employeeId}`}
                    className="focus-ring block truncate rounded font-bold text-foreground hover:text-brand hover:underline"
                  >
                    {row.name}
                  </Link>
                  <div className="truncate text-xs text-muted">{row.departmentName}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-right text-sm sm:gap-x-5">
                <div>
                  <div className="font-bold tabular-nums text-foreground">
                    {row.summary.positivePoints > 0 ? "+" : ""}
                    {row.summary.positivePoints}
                  </div>
                  <div className="text-[10px] uppercase text-muted">Positive</div>
                </div>
                <div>
                  <div
                    className={`font-bold tabular-nums ${
                      row.summary.negativePoints > 0 ? "text-negative" : "text-foreground"
                    }`}
                  >
                    {row.summary.negativePoints > 0 ? "−" : ""}
                    {row.summary.negativePoints}
                  </div>
                  <div className="text-[10px] uppercase text-muted">Negative</div>
                </div>
                <div className="w-14">
                  <div
                    className={`score-md text-xl ${row.summary.netPoints < 0 ? "text-negative" : "text-brand"}`}
                  >
                    {row.summary.netPoints >= 0 ? "+" : ""}
                    {row.summary.netPoints}
                  </div>
                  <div className="text-[10px] uppercase text-muted">Net</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
