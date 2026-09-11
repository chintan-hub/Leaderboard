import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeLeaderboard } from "@/lib/queries";
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

  const employees = await getEmployeeLeaderboard({ year, month });

  return (
    <div className="min-h-screen bg-[#efece6] py-8 print:bg-white print:py-0">
      {/* Screen-only preview chrome */}
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-2 print:hidden">
        <Link
          href={`/monthly?year=${year}&month=${month}`}
          className="focus-ring rounded text-sm font-semibold text-muted hover:text-brand"
        >
          ← Back to Monthly Results
        </Link>
        <PrintButton />
      </div>

      {/* The "paper" — this is the actual print preview */}
      <div className="mx-auto max-w-[210mm] bg-white p-[14mm] text-[#1a1712] shadow-xl print:max-w-none print:p-0 print:shadow-none">
        {/* Header */}
        <header className="flex items-end justify-between border-b-2 border-[#1a1712] pb-3">
          <div>
            <Link href="/" className="inline-block">
              <img src="/dentocrafts-logo.png" alt="DentoCrafts Digital Dental Lab" className="h-8 w-auto" />
            </Link>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Team Points</h1>
          </div>
          <div className="text-right text-xs">
            <div className="text-lg font-extrabold tracking-wide">{monthLabel(year, month)}</div>
            <div className="text-[#6b6157]">Generated on {generatedOnLabel()}</div>
          </div>
        </header>

        {/* Employee standings */}
        <section className="mt-8">
          <h2 className="break-after-avoid text-sm font-black uppercase tracking-[0.2em] border-b border-[#1a1712] pb-1.5">
            Employee Standings
          </h2>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#1a1712] text-left text-[10px] font-bold uppercase tracking-wide text-[#6b6157]">
                <th className="py-1.5 pr-2">#</th>
                <th className="py-1.5 pr-2">Employee</th>
                <th className="py-1.5 pr-2">Department</th>
                <th className="py-1.5 pr-2 text-right">Positive</th>
                <th className="py-1.5 pr-2 text-right">Negative</th>
                <th className="py-1.5 text-right">Net</th>
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
                  <td className="py-1.5 pr-2 text-right tabular-nums">
                    {emp.summary.positivePoints > 0 ? "+" : ""}
                    {emp.summary.positivePoints}
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">
                    {emp.summary.negativePoints > 0 ? "−" : ""}
                    {emp.summary.negativePoints}
                  </td>
                  <td className="py-1.5 text-right text-base font-black tabular-nums">
                    {emp.summary.netPoints >= 0 ? "+" : ""}
                    {emp.summary.netPoints}
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-[#6b6157]">
                    No employees recorded for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <footer className="mt-10 flex justify-between border-t border-[#e8e2d9] pt-3 text-[10px] text-[#6b6157]">
          <span>Generated from DentoCrafts Team Points</span>
          <span>{generatedAtLabel()}</span>
        </footer>
      </div>
    </div>
  );
}
