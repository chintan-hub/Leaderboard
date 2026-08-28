import Link from "next/link";
import {
  getDepartmentLeaderboard,
  getEmployeeLeaderboard,
  getEmployeeOfMonth,
  getRecentActivity,
  getTodaySummary,
} from "@/lib/queries";
import { Card, EmptyState, RankBadge, SectionTitle } from "@/components/ui";
import { DepartmentLeaderboardPanel, EmployeeLeaderboardPanel } from "@/components/leaderboard-panels";

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1))
    .toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .toUpperCase();
}

function todayLabel(): string {
  return new Date()
    .toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();
}

export default async function DashboardPage() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const [employeeOfMonth, employeeLeaderboard, departmentLeaderboard, recentActivity, today] =
    await Promise.all([
      getEmployeeOfMonth(year, month),
      getEmployeeLeaderboard({ year, month, withMovement: true }),
      getDepartmentLeaderboard({ year, month }),
      getRecentActivity(8),
      getTodaySummary(),
    ]);

  const activeDepartmentsToday = today.byDepartment.filter((d) => d.completed > 0 || d.rework > 0);

  return (
    <div className="space-y-10">
      {/* Employee of the Month — the visual centerpiece of the page */}
      <section>
        <p className="text-xs font-bold uppercase tracking-wider text-brand">{monthLabel(year, month)}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">Employee of the Month</h1>
        <div className="mt-4">
          <EmployeeOfMonthHero result={employeeOfMonth} />
        </div>
      </section>

      {/* TODAY */}
      <section>
        <SectionTitle eyebrow="Today" subtitle={todayLabel()}>
          Company Production
        </SectionTitle>
        {today.totalCompleted === 0 && today.totalRework === 0 ? (
          <EmptyState
            title="No production recorded today yet"
            description="Once an admin logs today's production, it shows up here immediately."
          />
        ) : (
          <Card>
            <div className="flex flex-wrap gap-8">
              <div>
                <div className="score-hero text-4xl text-foreground">{today.totalCompleted}</div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted">Cases Completed</div>
              </div>
              <div>
                <div className="score-hero text-4xl text-negative">{today.totalRework}</div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted">Cases Returned</div>
              </div>
              <div>
                <div className="score-hero text-4xl text-positive">{today.netProduction}</div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted">Net Cases</div>
              </div>
            </div>
            {activeDepartmentsToday.length > 0 && (
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-border pt-4 text-sm sm:grid-cols-3">
                {activeDepartmentsToday.map((d) => (
                  <div key={d.departmentId} className="flex justify-between gap-2">
                    <dt className="text-muted">{d.departmentName}</dt>
                    <dd className="font-bold tabular-nums text-foreground">{d.net}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>
        )}
      </section>

      {/* THIS MONTH — leaderboard */}
      <section>
        <SectionTitle eyebrow="This Month" subtitle={monthLabel(year, month)}>
          Employee Leaderboard
        </SectionTitle>
        <EmployeeLeaderboardPanel
          rows={employeeLeaderboard}
          emptyAction={
            <Link href="/employees" className="text-sm font-semibold text-brand hover:underline">
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
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle>Recent Activity</SectionTitle>
          <Link href="/activity" className="text-sm font-semibold text-brand hover:underline">
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
                <li key={row.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
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

function EmployeeOfMonthHero({
  result,
}: {
  result: Awaited<ReturnType<typeof getEmployeeOfMonth>>;
}) {
  if (result.status === "none") {
    return (
      <EmptyState
        title="No activity recorded this month yet"
        description="Employee of the Month is calculated automatically from this month's production and manual points."
      />
    );
  }

  if (result.status === "tie") {
    return (
      <Card className="border-info bg-info-tint">
        <p className="font-bold text-info">It&apos;s a tie — needs admin review</p>
        <p className="mt-1 text-sm text-foreground/80">
          These employees are tied on final score, cases completed, and cases returned after all
          automatic tiebreakers. No winner is chosen automatically.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {result.tiedCandidates.map((c) => (
            <li
              key={c.employeeId}
              className="rounded-full bg-white px-3 py-1 text-sm font-bold text-info shadow-sm"
            >
              {result.employeeNames[c.employeeId]} — {c.summary.finalScore} pts
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  const { winner, tieBrokenBy } = result;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold-tint via-white to-white p-6 shadow-[0_1px_2px_rgba(33,28,23,0.04),0_16px_32px_-16px_rgba(180,83,9,0.35)] sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <RankBadge rank={1} size="lg" />
          <div>
            <div className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {result.employeeNames[winner.employeeId]}
            </div>
            {tieBrokenBy && (
              <p className="mt-1 text-xs font-semibold text-muted">
                Tie broken by {tieBrokenBy.replace(/_/g, " ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-6 text-right sm:gap-10">
          <div>
            <div className="score-lg text-2xl text-foreground">{winner.summary.productionScore}</div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted">Production</div>
          </div>
          <div>
            <div className="score-lg text-2xl text-foreground">
              {winner.summary.manualScore >= 0 ? "+" : ""}
              {winner.summary.manualScore}
            </div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted">Manual</div>
          </div>
          <div>
            <div className="score-hero text-4xl text-gold sm:text-5xl">{winner.summary.finalScore}</div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted">Final Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
