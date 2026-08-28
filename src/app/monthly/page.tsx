import Link from "next/link";
import {
  getDepartmentLeaderboard,
  getEmployeeLeaderboard,
  getEmployeeOfMonth,
} from "@/lib/queries";
import { Card, EmptyState, RankBadge, SectionTitle } from "@/components/ui";
import { DepartmentLeaderboardPanel, EmployeeLeaderboardPanel } from "@/components/leaderboard-panels";

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export default async function MonthlyResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getUTCFullYear();
  const month = Number(params.month) || now.getUTCMonth() + 1;

  const [result, employeeLeaderboard, departmentLeaderboard] = await Promise.all([
    getEmployeeOfMonth(year, month),
    getEmployeeLeaderboard({ year, month }),
    getDepartmentLeaderboard({ year, month }),
  ]);

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const isCurrentMonth = year === now.getUTCFullYear() && month === now.getUTCMonth() + 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          eyebrow={isCurrentMonth ? "Current month" : "Historical"}
          subtitle="Isolated by calendar month — nothing carries over from month to month."
        >
          Monthly Results
        </SectionTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm font-semibold text-muted">
            <Link href={`/monthly?year=${prev.year}&month=${prev.month}`} className="hover:text-brand">
              ← Prev
            </Link>
            <span className="text-foreground">{monthLabel(year, month)}</span>
            <Link href={`/monthly?year=${next.year}&month=${next.month}`} className="hover:text-brand">
              Next →
            </Link>
          </div>
          <Link
            href={`/print/${year}/${month}`}
            target="_blank"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong"
          >
            🖨 Print Leaderboard
          </Link>
        </div>
      </div>

      {result.status === "none" && (
        <EmptyState
          title={`No activity recorded in ${monthLabel(year, month)}`}
          description="Employee of the Month is only calculated from transactions dated within the selected month."
        />
      )}

      {result.status === "tie" && (
        <Card className="border-info/40 bg-info-tint">
          <p className="font-bold text-info">Tied — needs admin review</p>
          <p className="mt-1 text-sm text-foreground/80">
            No winner was chosen automatically for {monthLabel(year, month)}.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {result.tiedCandidates.map((c) => (
              <li key={c.employeeId} className="flex justify-between">
                <span>{result.employeeNames[c.employeeId]}</span>
                <span className="font-bold">{c.summary.finalScore} pts</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {result.status === "winner" && (
        <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold-tint via-white to-white p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gold">Employee of the Month</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <RankBadge rank={1} size="lg" />
              <div>
                <div className="text-3xl font-black tracking-tight text-foreground">
                  {result.employeeNames[result.winner.employeeId]}
                </div>
                {result.tieBrokenBy && (
                  <p className="mt-1 text-xs font-semibold text-muted">
                    Tie broken by {result.tieBrokenBy.replace(/_/g, " ")}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="score-hero text-4xl text-gold">{result.winner.summary.finalScore}</div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted">
                Production {result.winner.summary.productionScore} · Manual{" "}
                {result.winner.summary.manualScore >= 0 ? "+" : ""}
                {result.winner.summary.manualScore}
              </div>
            </div>
          </div>
        </div>
      )}

      <section>
        <SectionTitle subtitle={monthLabel(year, month)}>Employee Leaderboard</SectionTitle>
        <EmployeeLeaderboardPanel rows={employeeLeaderboard} />
      </section>

      <section>
        <SectionTitle subtitle="Ranked by each department's own configured ranking metric">
          Department Leaderboard
        </SectionTitle>
        <DepartmentLeaderboardPanel rows={departmentLeaderboard} />
      </section>
    </div>
  );
}
