import Link from "next/link";
import { getEmployeeLeaderboard, getRecentActivity } from "@/lib/queries";
import { getCategoryLabel } from "@/lib/scoring/point-categories";
import { BigNumber, Card, EmptyState, SectionTitle } from "@/components/ui";
import { EmployeeLeaderboardPanel } from "@/components/leaderboard-panels";

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1))
    .toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .toUpperCase();
}

export default async function DashboardPage() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const [employeeLeaderboard, recentActivity] = await Promise.all([
    getEmployeeLeaderboard({ year, month, withMovement: true }),
    getRecentActivity(8),
  ]);

  const teamTotals = employeeLeaderboard.reduce(
    (acc, row) => ({
      netPoints: acc.netPoints + row.summary.netPoints,
      positivePoints: acc.positivePoints + row.summary.positivePoints,
      negativePoints: acc.negativePoints + row.summary.negativePoints,
      recognitionCount: acc.recognitionCount + row.summary.recognitionCount,
      deductionCount: acc.deductionCount + row.summary.deductionCount,
    }),
    { netPoints: 0, positivePoints: 0, negativePoints: 0, recognitionCount: 0, deductionCount: 0 },
  );

  return (
    <div className="space-y-10">
      {/* THIS MONTH — team points */}
      <section>
        <SectionTitle eyebrow="This Month" subtitle={monthLabel(year, month)}>
          Team Points
        </SectionTitle>
        <Card raised>
          <div className="flex flex-wrap gap-x-10 gap-y-5">
            <BigNumber
              value={`${teamTotals.netPoints >= 0 ? "+" : ""}${teamTotals.netPoints}`}
              label="Team Net Points"
            />
            <BigNumber
              value={`${teamTotals.positivePoints > 0 ? "+" : ""}${teamTotals.positivePoints}`}
              label="Positive Points"
              tone="positive"
            />
            <BigNumber
              value={`${teamTotals.negativePoints > 0 ? "−" : ""}${teamTotals.negativePoints}`}
              label="Negative Points"
              tone={teamTotals.negativePoints > 0 ? "negative" : "neutral"}
            />
            <BigNumber value={teamTotals.recognitionCount} label="Recognitions" />
            <BigNumber value={teamTotals.deductionCount} label="Deductions" />
          </div>
        </Card>
      </section>

      {/* THIS MONTH — employee standings */}
      <section>
        <SectionTitle eyebrow="This Month" subtitle={monthLabel(year, month)}>
          Employee Standings
        </SectionTitle>
        <EmployeeLeaderboardPanel
          rows={employeeLeaderboard}
          emptyAction={
            <Link href="/employees" className="focus-ring rounded text-sm font-semibold text-brand hover:underline">
              Go to Employees
            </Link>
          }
        />
      </section>

      {/* Recent activity */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <SectionTitle className="mb-0">Recent Activity</SectionTitle>
          <Link
            href="/activity"
            className="focus-ring rounded text-sm font-semibold text-brand hover:underline"
          >
            View full history →
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <EmptyState
            title="No activity recorded yet"
            description="Points awarded by an admin will appear here."
          />
        ) : (
          <Card className="p-0">
            <ul className="divide-y divide-border">
              {recentActivity.map((row) => {
                const categoryLabel = getCategoryLabel(row.category);
                return (
                  <li key={row.id} className="list-row flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                    <div>
                      <span className="font-bold text-foreground">{row.employeeName}</span>
                      <span className="text-muted">
                        {" "}
                        · {row.departmentName}
                        {categoryLabel ? ` · ${categoryLabel}` : ""} · {row.reason}
                      </span>
                    </div>
                    <span className="whitespace-nowrap font-mono text-xs text-muted">
                      {row.eventDate.toLocaleDateString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
