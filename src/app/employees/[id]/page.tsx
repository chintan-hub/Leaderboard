import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeDetail } from "@/lib/queries";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import TrendChart from "@/components/trend-chart";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployeeDetail(id);
  if (!employee) notFound();

  const { summary } = employee;

  return (
    <div className="space-y-6">
      <Link
        href={`/departments/${employee.departmentId}`}
        className="focus-ring inline-flex items-center gap-1 rounded text-sm font-semibold text-muted hover:text-brand"
      >
        ← {employee.departmentName}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <SectionTitle eyebrow={employee.departmentName} subtitle="All-time totals — nothing is hidden">
          {employee.name}
        </SectionTitle>
        {!employee.isActive && <Badge tone="neutral">Inactive</Badge>}
      </div>

      <div>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">All-Time</h3>
        <Card raised>
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <div className="score-lg text-2xl text-foreground">{summary.casesCompleted}</div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Completed</div>
            </div>
            <div>
              <div className={`score-lg text-2xl ${summary.casesReturned > 0 ? "text-negative" : "text-foreground"}`}>
                {summary.casesReturned}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Returned</div>
            </div>
            <div>
              <div className="score-lg text-2xl text-positive">{summary.productionScore}</div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Net</div>
            </div>
            <div>
              <div className={`score-lg text-2xl ${summary.manualScore < 0 ? "text-negative" : "text-foreground"}`}>
                {summary.manualScore >= 0 ? "+" : ""}
                {summary.manualScore}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Manual</div>
            </div>
            <div>
              <div className="score-hero text-4xl text-brand">{summary.finalScore}</div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Final Score</div>
            </div>
          </div>
          {summary.casesReturnedExternal > 0 && (
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted">
              {summary.casesReturnedExternal} additional returned case
              {summary.casesReturnedExternal === 1 ? "" : "s"} logged as external (not this employee&apos;s fault) —
              not charged against the score.
            </p>
          )}
        </Card>
      </div>

      {employee.monthlyHistory.length === 0 ? (
        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Monthly history</h3>
          <EmptyState
            title="No production recorded yet"
            description="Monthly history will appear here once production is logged."
          />
        </div>
      ) : (
        <>
          <div>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Monthly trend</h3>
            <Card>
              <TrendChart
                label="net cases"
                points={[...employee.monthlyHistory]
                  .reverse()
                  .slice(-12)
                  .map((m) => ({ year: m.year, month: m.month, value: m.net }))}
              />
            </Card>
          </div>

          <div>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              Monthly history — every month on record
            </h3>
            <Card className="p-0">
              <ul className="divide-y divide-border">
                {employee.monthlyHistory.map((m) => (
                  <li
                    key={`${m.year}-${m.month}`}
                    className="list-row flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
                  >
                    <span className="font-semibold text-foreground">
                      {new Date(Date.UTC(m.year, m.month - 1, 1)).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </span>
                    <span className="flex items-center gap-4 text-right tabular-nums">
                      <span>
                        <span className="font-bold text-foreground">{m.casesCompleted}</span>{" "}
                        <span className="text-xs text-muted">completed</span>
                      </span>
                      <span>
                        <span className={`font-bold ${m.casesReturned > 0 ? "text-negative" : "text-foreground"}`}>
                          {m.casesReturned}
                        </span>{" "}
                        <span className="text-xs text-muted">returned</span>
                      </span>
                      <span className={`font-bold ${m.finalScore < 0 ? "text-negative" : "text-brand"}`}>
                        {m.finalScore >= 0 ? "+" : ""}
                        {m.finalScore} final
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
