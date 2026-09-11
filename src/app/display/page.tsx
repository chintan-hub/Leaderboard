import Link from "next/link";
import { getEmployeeLeaderboard } from "@/lib/queries";
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

  const leaderboard = await getEmployeeLeaderboard({ year, month });
  const topRows = leaderboard.slice(0, 8);

  const teamNetPoints = leaderboard.reduce((sum, r) => sum + r.summary.netPoints, 0);
  const teamPositivePoints = leaderboard.reduce((sum, r) => sum + r.summary.positivePoints, 0);

  return (
    <div className="min-h-screen bg-background px-10 py-8 text-foreground">
      <AutoRefresh />

      <header className="flex items-center justify-between border-b border-border pb-5">
        <Link href="/" className="flex items-center">
          <img src="/dentocrafts-logo.png" alt="DentoCrafts Digital Dental Lab" className="h-12 w-auto" />
        </Link>
        <div className="text-right">
          <div className="text-xs font-bold uppercase tracking-widest text-muted">Today</div>
          <div className="text-lg font-bold">{todayLabel()}</div>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-8">
          {/* This month's standings */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-brand">
              This Month · {monthLabel(year, month)}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">Employee Standings</h2>
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
                  <div className="score-lg text-3xl text-brand">
                    {row.summary.netPoints >= 0 ? "+" : ""}
                    {row.summary.netPoints}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-8">
          {/* Team totals — a snapshot, not a comparison */}
          <section className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Team This Month</p>
            <div className="mt-4 space-y-4">
              <div>
                <div className="score-hero text-4xl text-brand">
                  {teamNetPoints >= 0 ? "+" : ""}
                  {teamNetPoints}
                </div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted">Team Net Points</div>
              </div>
              <div>
                <div className="score-lg text-2xl text-positive">
                  {teamPositivePoints > 0 ? "+" : ""}
                  {teamPositivePoints}
                </div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted">Positive Recognition</div>
              </div>
            </div>
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
