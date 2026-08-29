import Link from "next/link";
import type { DepartmentRankingResult } from "@/lib/scoring/department";
import type { EmployeeLeaderboardRow } from "@/lib/queries";
import { Badge, Card, EmptyState, MovementIndicator, RankBadge } from "@/components/ui";

const RANKING_METRIC_LABEL: Record<string, string> = {
  AVG_NET_PER_EMPLOYEE: "Average net production per employee",
  TOTAL_NET_PRODUCTION: "Total net production",
};

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
        description="Add employees under a department to start tracking production."
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
                  {row.summary.casesCompleted} completed · {row.summary.casesReturned} returned
                </span>
                <span className="score-lg text-2xl text-foreground">{row.summary.finalScore}</span>
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
                  <div className="font-bold tabular-nums text-foreground">{row.summary.casesCompleted}</div>
                  <div className="text-[10px] uppercase text-muted">Completed</div>
                </div>
                <div>
                  <div
                    className={`font-bold tabular-nums ${
                      row.summary.casesReturned > 0 ? "text-negative" : "text-foreground"
                    }`}
                  >
                    {row.summary.casesReturned}
                  </div>
                  <div className="text-[10px] uppercase text-muted">Returned</div>
                </div>
                <div>
                  <div className="font-bold tabular-nums text-foreground">{row.summary.productionScore}</div>
                  <div className="text-[10px] uppercase text-muted">Net</div>
                </div>
                <div>
                  <div className="font-bold tabular-nums text-foreground">
                    {row.summary.manualScore >= 0 ? "+" : ""}
                    {row.summary.manualScore}
                  </div>
                  <div className="text-[10px] uppercase text-muted">Manual</div>
                </div>
                <div className="w-14">
                  <div
                    className={`score-md text-xl ${row.summary.finalScore < 0 ? "text-negative" : "text-brand"}`}
                  >
                    {row.summary.finalScore}
                  </div>
                  <div className="text-[10px] uppercase text-muted">Final</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function DepartmentLeaderboardPanel({ rows }: { rows: DepartmentRankingResult[] }) {
  if (rows.length === 0) {
    return <EmptyState title="No departments yet" description="Departments are seeded on setup." />;
  }

  return (
    <Card className="p-0">
      <ul className="divide-y divide-border">
        {rows.map((dept, i) => (
          <li
            key={dept.departmentId}
            className="list-row flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
          >
            <div className="flex items-center gap-3">
              <RankBadge rank={i + 1} size="sm" />
              <div>
                <Link
                  href={`/departments/${dept.departmentId}`}
                  className="focus-ring rounded font-bold text-foreground hover:text-brand hover:underline"
                >
                  {dept.departmentName}
                </Link>
                <div className="text-xs text-muted">
                  {dept.employeeCount} {dept.employeeCount === 1 ? "employee" : "employees"} ·{" "}
                  <Badge tone="neutral">{RANKING_METRIC_LABEL[dept.metricKey] ?? dept.metricKey}</Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-right text-sm">
              <div>
                <div className="font-bold tabular-nums text-foreground">{dept.totalCasesCompleted}</div>
                <div className="text-[10px] uppercase text-muted">Completed</div>
              </div>
              <div>
                <div
                  className={`font-bold tabular-nums ${
                    dept.totalCasesReturned > 0 ? "text-negative" : "text-foreground"
                  }`}
                >
                  {dept.totalCasesReturned}
                </div>
                <div className="text-[10px] uppercase text-muted">Returned</div>
              </div>
              <div className="w-16">
                <div className="score-md text-xl text-brand">{dept.metricValue.toFixed(1)}</div>
                <div className="text-[10px] uppercase text-muted">Ranking</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
