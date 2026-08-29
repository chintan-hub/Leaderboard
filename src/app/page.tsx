import Link from "next/link";
import {
  getDepartmentLeaderboard,
  getEmployeeLeaderboard,
  getRecentActivity,
} from "@/lib/queries";
import { Card, EmptyState, SectionTitle } from "@/components/ui";
import { DepartmentLeaderboardPanel, EmployeeLeaderboardPanel } from "@/components/leaderboard-panels";

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1))
    .toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .toUpperCase();
}

export default async function DashboardPage() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const [employeeLeaderboard, departmentLeaderboard, recentActivity] = await Promise.all([
    getEmployeeLeaderboard({ year, month, withMovement: true }),
    getDepartmentLeaderboard({ year, month }),
    getRecentActivity(8),
  ]);

  return (
    <div className="space-y-10">
      {/* THIS MONTH — leaderboard */}
      <section>
        <SectionTitle eyebrow="This Month" subtitle={monthLabel(year, month)}>
          Employee Leaderboard
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

      {/* THIS MONTH — department leaderboard */}
      <section>
        <SectionTitle
          eyebrow="This Month"
          subtitle="Ranked by each department's own configured ranking metric"
        >
          Department Leaderboard
        </SectionTitle>
        <DepartmentLeaderboardPanel rows={departmentLeaderboard} />
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
            description="Production entries and manual points will appear here as soon as an admin logs them."
          />
        ) : (
          <Card className="p-0">
            <ul className="divide-y divide-border">
              {recentActivity.map((row) => (
                <li key={row.id} className="list-row flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                  <div>
                    <span className="font-bold text-foreground">{row.employeeName}</span>
                    <span className="text-muted"> · {row.departmentName} · {row.reason}</span>
                  </div>
                  <span className="whitespace-nowrap font-mono text-xs text-muted">
                    {row.eventDate.toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
