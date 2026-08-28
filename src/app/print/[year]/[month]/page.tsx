import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDepartmentLeaderboard,
  getEmployeeLeaderboard,
  getEmployeeOfMonth,
} from "@/lib/queries";
import PrintButton from "../../print-button";

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1))
    .toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .toUpperCase();
}

function generatedOnLabel(): string {
  return new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function generatedAtLabel(): string {
  return new Date().toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const RANKING_METRIC_LABEL: Record<string, string> = {
  AVG_NET_PER_EMPLOYEE: "Average net production per employee",
  TOTAL_NET_PRODUCTION: "Total net production",
};

export default async function PrintLeaderboardPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year: yearParam, month: monthParam } = await params;
  const year = Number(yearParam);
  const month = Number(monthParam);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    notFound();
  }

  const [eom, employees, departments] = await Promise.all([
    getEmployeeOfMonth(year, month),
    getEmployeeLeaderboard({ year, month }),
    getDepartmentLeaderboard({ year, month }),
  ]);

  return (
    <div className="min-h-screen bg-[#efece6] py-8 print:bg-white print:py-0">
      {/* Screen-only preview chrome */}
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-2 print:hidden">
        <Link href={`/monthly?year=${year}&month=${month}`} className="text-sm font-semibold text-muted hover:text-brand">
          ← Back to Monthly Results
        </Link>
        <PrintButton />
      </div>

      {/* The "paper" — this is the actual print preview */}
      <div className="mx-auto max-w-[210mm] bg-white p-[14mm] text-[#1a1712] shadow-xl print:max-w-none print:p-0 print:shadow-none">
        {/* Header */}
        <header className="flex items-end justify-between border-b-2 border-[#1a1712] pb-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
              <span>🦷</span>
              <span>DentoCrafts Lab Leaderboard</span>
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Lab Leaderboard</h1>
          </div>
          <div className="text-right text-xs">
            <div className="text-lg font-extrabold tracking-wide">{monthLabel(year, month)}</div>
            <div className="text-[#6b6157]">Generated on {generatedOnLabel()}</div>
          </div>
        </header>

        {/* Employee of the Month — poster treatment */}
        {eom.status === "winner" && (
          <section className="my-6 break-inside-avoid rounded-lg border-2 border-[#b45309] bg-[#fff7e6] px-6 py-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b45309]">
              Employee of the Month
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight">
              {eom.employeeNames[eom.winner.employeeId]}
            </p>
            <p className="mt-0.5 text-sm font-bold uppercase tracking-wide text-[#6b6157]">
              {employees.find((e) => e.employeeId === eom.winner.employeeId)?.departmentName}
            </p>
            <p className="mt-4 text-5xl font-black text-[#b45309]">{eom.winner.summary.finalScore}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-[#6b6157]">Final Score</p>
            <p className="mt-3 text-sm font-semibold text-[#4a4238]">
              {eom.winner.summary.productionScore} net production · {eom.winner.summary.manualScore >= 0 ? "+" : ""}
              {eom.winner.summary.manualScore} manual points
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-[#b45309]">
              {monthLabel(year, month)}
            </p>
          </section>
        )}
        {eom.status === "tie" && (
          <section className="my-6 break-inside-avoid rounded-lg border-2 border-[#1a1712] px-6 py-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em]">Employee of the Month — Tied</p>
            <p className="mt-2 text-sm">
              {eom.tiedCandidates.map((c) => eom.employeeNames[c.employeeId]).join(" · ")}
            </p>
          </section>
        )}
        {eom.status === "none" && (
          <section className="my-6 break-inside-avoid rounded-lg border-2 border-dashed border-[#c9c1b4] px-6 py-5 text-center text-sm text-[#6b6157]">
            No activity recorded in {monthLabel(year, month)}.
          </section>
        )}

        {/* Top employees */}
        <section className="mt-8">
          <h2 className="break-after-avoid text-sm font-black uppercase tracking-[0.2em] border-b border-[#1a1712] pb-1.5">
            Top Employees
          </h2>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#1a1712] text-left text-[10px] font-bold uppercase tracking-wide text-[#6b6157]">
                <th className="py-1.5 pr-2">#</th>
                <th className="py-1.5 pr-2">Employee</th>
                <th className="py-1.5 pr-2">Department</th>
                <th className="py-1.5 pr-2 text-right">Completed</th>
                <th className="py-1.5 pr-2 text-right">Returned</th>
                <th className="py-1.5 pr-2 text-right">Net</th>
                <th className="py-1.5 pr-2 text-right">Manual</th>
                <th className="py-1.5 text-right">Final</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.employeeId} className="break-inside-avoid border-b border-[#e8e2d9]">
                  <td className="py-1.5 pr-2 font-bold">
                    {emp.rank <= 3 ? (
                      <span
                        className={
                          emp.rank === 1
                            ? "text-[#b45309]"
                            : emp.rank === 2
                              ? "text-[#52525b]"
                              : "text-[#9a5b2e]"
                        }
                      >
                        {emp.rank}
                      </span>
                    ) : (
                      emp.rank
                    )}
                  </td>
                  <td className="py-1.5 pr-2 font-bold">{emp.name}</td>
                  <td className="py-1.5 pr-2 text-[#6b6157]">{emp.departmentName}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{emp.summary.casesCompleted}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{emp.summary.casesReturned}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{emp.summary.productionScore}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">
                    {emp.summary.manualScore >= 0 ? "+" : ""}
                    {emp.summary.manualScore}
                  </td>
                  <td className="py-1.5 text-right text-base font-black tabular-nums">
                    {emp.summary.finalScore}
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-[#6b6157]">
                    No employees recorded for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Department leaderboard */}
        <section className="mt-8 break-inside-avoid">
          <h2 className="break-after-avoid text-sm font-black uppercase tracking-[0.2em] border-b border-[#1a1712] pb-1.5">
            Department Leaderboard
          </h2>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#1a1712] text-left text-[10px] font-bold uppercase tracking-wide text-[#6b6157]">
                <th className="py-1.5 pr-2">#</th>
                <th className="py-1.5 pr-2">Department</th>
                <th className="py-1.5 pr-2 text-right">Completed</th>
                <th className="py-1.5 pr-2 text-right">Returned</th>
                <th className="py-1.5 pr-2 text-right">Net</th>
                <th className="py-1.5 text-right">Ranking Value</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, i) => (
                <tr key={dept.departmentId} className="break-inside-avoid border-b border-[#e8e2d9]">
                  <td className="py-1.5 pr-2 font-bold">{i + 1}</td>
                  <td className="py-1.5 pr-2 font-bold">{dept.departmentName}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{dept.totalCasesCompleted}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{dept.totalCasesReturned}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{dept.totalProductionScore}</td>
                  <td className="py-1.5 text-right text-base font-black tabular-nums">
                    {dept.metricValue.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1.5 text-[10px] text-[#6b6157]">
            Ranking value ={" "}
            {departments[0] ? RANKING_METRIC_LABEL[departments[0].metricKey] ?? departments[0].metricKey : "—"}{" "}
            (each department&apos;s own configured metric).
          </p>
        </section>

        <footer className="mt-10 flex justify-between border-t border-[#e8e2d9] pt-3 text-[10px] text-[#6b6157]">
          <span>Generated from Lab Leaderboard</span>
          <span>{generatedAtLabel()}</span>
        </footer>
      </div>
    </div>
  );
}
