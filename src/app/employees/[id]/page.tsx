import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeDetail } from "@/lib/queries";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployeeDetail(id);
  if (!employee) notFound();

  const { summary, today } = employee;

  return (
    <div className="space-y-6">
      <Link
        href={`/departments/${employee.departmentId}`}
        className="text-sm font-semibold text-muted hover:text-brand"
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
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Today</h3>
        {today.casesCompleted === 0 && today.casesReturned === 0 ? (
          <Card className="py-4">
            <p className="text-sm text-muted">No production recorded for today yet.</p>
          </Card>
        ) : (
          <Card>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <div className="score-md text-xl text-foreground">{today.casesCompleted}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Completed</div>
              </div>
              <div>
                <div className={`score-md text-xl ${today.casesReturned > 0 ? "text-negative" : "text-foreground"}`}>
                  {today.casesReturned}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Returned</div>
              </div>
              <div>
                <div className="score-md text-xl text-positive">{today.net}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Net</div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">All-Time</h3>
        <Card>
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

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Daily history</h3>
        {employee.dailyHistory.length === 0 ? (
          <EmptyState title="No production recorded yet" description="Daily history will appear here once production is logged." />
        ) : (
          <Card className="p-0">
            <ul className="divide-y divide-border">
              {employee.dailyHistory.map((day) => (
                <li
                  key={day.date.toISOString()}
                  className="flex items-center justify-between px-5 py-2.5 text-sm"
                >
                  <span className="font-semibold text-muted">
                    {day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="flex items-center gap-3 tabular-nums">
                    {day.rework > 0 && <span className="text-xs text-negative">−{day.rework} returned</span>}
                    <span className={`font-bold ${day.net < 0 ? "text-negative" : "text-foreground"}`}>
                      {day.net >= 0 ? "+" : ""}
                      {day.net}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
