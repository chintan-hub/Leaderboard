import Link from "next/link";
import { notFound } from "next/navigation";
import { getDailyProductionReport } from "@/lib/queries";
import PrintButton from "../../print-button";

function dateLabel(date: Date): string {
  return date
    .toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
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

export default async function PrintTodaysProductionPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date: dateParam } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) notFound();
  const date = new Date(`${dateParam}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) notFound();

  const report = await getDailyProductionReport(date);

  return (
    <div className="min-h-screen bg-[#efece6] py-8 print:bg-white print:py-0">
      {/* Screen-only preview chrome */}
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-2 print:hidden">
        <Link href="/admin/production" className="text-sm font-semibold text-muted hover:text-brand">
          ← Back to Production
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
            <h1 className="mt-1 text-3xl font-black tracking-tight">Lab Production</h1>
          </div>
          <div className="text-right text-xs">
            <div className="text-lg font-extrabold tracking-wide">{dateLabel(date)}</div>
            <div className="text-[#6b6157]">Generated on {generatedOnLabel()}</div>
          </div>
        </header>

        {/* Lab total */}
        <section className="my-6 flex break-inside-avoid items-center justify-around rounded-lg border-2 border-[#1a1712] px-6 py-6 text-center">
          <div>
            <p className="text-4xl font-black">{report.lab.casesCompleted}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-[#6b6157]">Cases Completed</p>
          </div>
          <div>
            <p className="text-4xl font-black">{report.lab.casesReturned}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-[#6b6157]">Cases Returned</p>
          </div>
          <div>
            <p className="text-5xl font-black text-[#b45309]">{report.lab.net}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-[#6b6157]">Lab Total Net Cases</p>
          </div>
        </section>

        {/* Department breakdown */}
        <section className="mt-8">
          <h2 className="break-after-avoid border-b border-[#1a1712] pb-1.5 text-sm font-black uppercase tracking-[0.2em]">
            Department Breakdown
          </h2>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#1a1712] text-left text-[10px] font-bold uppercase tracking-wide text-[#6b6157]">
                <th className="py-1.5 pr-2">Department</th>
                <th className="py-1.5 pr-2 text-right">Completed</th>
                <th className="py-1.5 pr-2 text-right">Returned</th>
                <th className="py-1.5 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {report.departments.map((dept) => (
                <tr key={dept.departmentId} className="break-inside-avoid border-b border-[#e8e2d9]">
                  <td className="py-1.5 pr-2 font-bold">{dept.departmentName}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{dept.totals.casesCompleted}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{dept.totals.casesReturned}</td>
                  <td className="py-1.5 text-right text-base font-black tabular-nums">{dept.totals.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Employee-level breakdown, per department with activity */}
        {report.departments
          .filter((dept) => dept.employees.length > 0)
          .map((dept) => (
            <section key={dept.departmentId} className="mt-6 break-inside-avoid">
              <h3 className="break-after-avoid border-b border-[#e8e2d9] pb-1 text-xs font-black uppercase tracking-[0.15em] text-[#6b6157]">
                {dept.departmentName}
              </h3>
              <table className="mt-2 w-full border-collapse text-sm">
                <tbody>
                  {dept.employees.map((emp) => (
                    <tr key={emp.employeeId} className="break-inside-avoid border-b border-[#f2efe9]">
                      <td className="py-1 pr-2 font-semibold">{emp.name}</td>
                      <td className="py-1 pr-2 text-right tabular-nums text-[#6b6157]">
                        {emp.completed} completed
                      </td>
                      <td className="py-1 pr-2 text-right tabular-nums text-[#6b6157]">
                        {emp.rework > 0 ? `${emp.rework} returned` : ""}
                      </td>
                      <td className="py-1 text-right font-bold tabular-nums">{emp.net} net</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}

        {report.departments.every((d) => d.employees.length === 0) && (
          <p className="mt-6 text-center text-sm text-[#6b6157]">No production recorded for this date.</p>
        )}

        <footer className="mt-10 flex justify-between border-t border-[#e8e2d9] pt-3 text-[10px] text-[#6b6157]">
          <span>Generated from Lab Leaderboard</span>
          <span>{generatedAtLabel()}</span>
        </footer>
      </div>
    </div>
  );
}
