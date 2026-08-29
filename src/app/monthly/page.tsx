import Link from "next/link";
import { getDepartmentLeaderboard, getEmployeeLeaderboard } from "@/lib/queries";
import { SectionTitle } from "@/components/ui";
import { IconDownload, IconPrinter } from "@/components/icons";
import { DepartmentLeaderboardPanel, EmployeeLeaderboardPanel } from "@/components/leaderboard-panels";
import MonthlyPerformanceChart from "./monthly-performance-chart";

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

  const [employeeLeaderboard, departmentLeaderboard] = await Promise.all([
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
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 text-sm font-semibold text-muted">
            <Link
              href={`/monthly?year=${prev.year}&month=${prev.month}`}
              className="focus-ring rounded-md px-2.5 py-1.5 transition hover:bg-surface-hover hover:text-foreground"
            >
              ← Prev
            </Link>
            <span className="px-2 text-foreground">{monthLabel(year, month)}</span>
            <Link
              href={`/monthly?year=${next.year}&month=${next.month}`}
              className="focus-ring rounded-md px-2.5 py-1.5 transition hover:bg-surface-hover hover:text-foreground"
            >
              Next →
            </Link>
          </div>
          <Link
            href={`/print/${year}/${month}`}
            target="_blank"
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-surface transition hover:bg-brand-strong"
          >
            <IconPrinter className="h-4 w-4" />
            Print
          </Link>
          <Link
            href={`/api/export/monthly?year=${year}&month=${month}`}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-border-strong hover:bg-surface-hover"
          >
            <IconDownload className="h-4 w-4" />
            Export This Month
          </Link>
          <Link
            href="/api/export/historical"
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-border-strong hover:bg-surface-hover"
          >
            <IconDownload className="h-4 w-4" />
            Export All History
          </Link>
        </div>
      </div>

      <section>
        <SectionTitle subtitle={monthLabel(year, month)}>Employee Leaderboard</SectionTitle>
        <EmployeeLeaderboardPanel rows={employeeLeaderboard} />
      </section>

      {employeeLeaderboard.length > 0 && (
        <section>
          <SectionTitle subtitle="Cases completed vs. cases returned, for every employee with activity this month">
            Completed vs Returned
          </SectionTitle>
          <MonthlyPerformanceChart
            rows={employeeLeaderboard
              .filter((r) => r.summary.casesCompleted > 0 || r.summary.casesReturned > 0)
              .map((r) => ({
                name: r.name,
                completed: r.summary.casesCompleted,
                returned: r.summary.casesReturned,
              }))}
          />
        </section>
      )}

      <section>
        <SectionTitle subtitle="Ranked by each department's own configured ranking metric">
          Department Leaderboard
        </SectionTitle>
        <DepartmentLeaderboardPanel rows={departmentLeaderboard} />
      </section>
    </div>
  );
}
