import Link from "next/link";
import {
  getDepartmentLeaderboard,
  getEmployeeLeaderboard,
  getEmployeeOfMonth,
  getTodaySummary,
} from "@/lib/queries";
import { RankBadge } from "@/components/ui";
import AutoRefresh from "./auto-refresh";

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1))
    .toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .toUpperCase();
}

function todayLabel(): string {
  return new Date()
    .toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })
    .toUpperCase();
}

export const dynamic = "force-dynamic";

export default async function DisplayModePage() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const [employeeOfMonth, leaderboard, departmentLeaderboard, today] = await Promise.all([
    getEmployeeOfMonth(year, month),
    getEmployeeLeaderboard({ year, month }),
    getDepartmentLeaderboard({ year, month }),
    getTodaySummary(),
  ]);

  const topRows = leaderboard.slice(0, 8);

  return (
    <div className="min-h-screen bg-background px-10 py-8 text-foreground">
      <AutoRefresh />

      <header className="flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-2xl text-white">
            🦷
          </span>
          <span className="text-2xl font-extrabold tracking-tight">DentoCraft Lab Leaderboard</span>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold uppercase tracking-widest text-muted">Today</div>
          <div className="text-lg font-bold">{todayLabel()}</div>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-8">
          {/* Employee of the Month */}
          {employeeOfMonth.status === "winner" && (
            <section className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold-tint via-white to-white p-8 shadow-[0_20px_50px_-24px_rgba(180,83,9,0.4)]">
              <p className="text-xs font-bold uppercase tracking-widest text-gold">
                {monthLabel(year, month)} · Employee of the Month
              </p>
              <div className="mt-3 flex items-end justify-between gap-6">
                <div className="flex items-center gap-5">
                  <RankBadge rank={1} size="lg" />
                  <div className="text-5xl font-black tracking-tight">
                    {employeeOfMonth.employeeNames[employeeOfMonth.winner.employeeId]}
                  </div>
                </div>
                <div className="text-right">
                  <div className="score-hero text-6xl text-gold">
                    {employeeOfMonth.winner.summary.finalScore}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wide text-muted">Final Score</div>
                </div>
              </div>
            </section>
          )}

          {/* This month's leaderboard */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-brand">
              This Month · {monthLabel(year, month)}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">Employee Leaderboard</h2>
            <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
              {topRows.map((row) => (
                <li key={row.employeeId} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-4">
                    <RankBadge rank={row.rank} />
                    <div>
                      <div className="text-xl font-extrabold">{row.name}</div>
                      <div className="text-sm text-muted">{row.departmentName}</div>
                    </div>
                  </div>
                  <div className="score-lg text-3xl text-brand">{row.summary.finalScore}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-8">
          {/* Today */}
          <section className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Today&apos;s Production</p>
            <div className="mt-3 grid grid-cols-3 gap-4">
              <div>
                <div className="score-hero text-3xl">{today.totalCompleted}</div>
                <div className="text-[11px] font-bold uppercase text-muted">Completed</div>
              </div>
              <div>
                <div className="score-hero text-3xl text-negative">{today.totalRework}</div>
                <div className="text-[11px] font-bold uppercase text-muted">Returned</div>
              </div>
              <div>
                <div className="score-hero text-3xl text-positive">{today.netProduction}</div>
                <div className="text-[11px] font-bold uppercase text-muted">Net Cases</div>
              </div>
            </div>
          </section>

          {/* Department leaderboard */}
          <section className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Department Leaderboard</p>
            <ul className="mt-3 divide-y divide-border">
              {departmentLeaderboard.map((dept, i) => (
                <li key={dept.departmentId} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <RankBadge rank={i + 1} size="sm" />
                    <span className="font-bold">{dept.departmentName}</span>
                  </div>
                  <span className="score-md text-lg text-brand">{dept.metricValue.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <footer className="mt-10 flex items-center justify-between text-xs text-muted">
        <span>Updates automatically · view-only display</span>
        <Link href="/" className="underline">
          Exit display mode
        </Link>
      </footer>
    </div>
  );
}
