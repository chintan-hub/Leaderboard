import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeDetail } from "@/lib/queries";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import TrendChart from "@/components/trend-chart";

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployeeDetail(id);
  if (!employee) notFound();

  const { summary, currentMonth } = employee;
  const now = new Date();

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">All-Time</h3>
          <Card raised>
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <div className="score-lg text-2xl text-foreground">
                  {summary.positivePoints > 0 ? "+" : ""}
                  {summary.positivePoints}
                </div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted">Positive</div>
              </div>
              <div>
                <div className={`score-lg text-2xl ${summary.negativePoints > 0 ? "text-negative" : "text-foreground"}`}>
                  {summary.negativePoints > 0 ? "−" : ""}
                  {summary.negativePoints}
                </div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted">Negative</div>
              </div>
              <div>
                <div className="score-hero text-4xl text-brand">
                  {summary.netPoints >= 0 ? "+" : ""}
                  {summary.netPoints}
                </div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted">Total Points</div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            This Month · {monthLabel(now.getUTCFullYear(), now.getUTCMonth() + 1)}
          </h3>
          <Card raised>
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <div className="score-lg text-2xl text-foreground">
                  {currentMonth.positivePoints > 0 ? "+" : ""}
                  {currentMonth.positivePoints}
                </div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted">Positive</div>
              </div>
              <div>
                <div className={`score-lg text-2xl ${currentMonth.negativePoints > 0 ? "text-negative" : "text-foreground"}`}>
                  {currentMonth.negativePoints > 0 ? "−" : ""}
                  {currentMonth.negativePoints}
                </div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted">Negative</div>
              </div>
              <div>
                <div className="score-hero text-4xl text-brand">
                  {currentMonth.netPoints >= 0 ? "+" : ""}
                  {currentMonth.netPoints}
                </div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted">Net Points</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {employee.monthlyHistory.length === 0 ? (
        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Monthly history</h3>
          <EmptyState
            title="No points recorded yet"
            description="Monthly history will appear here once a point is awarded."
          />
        </div>
      ) : (
        <>
          <div>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Monthly trend</h3>
            <Card>
              <TrendChart
                label="net points"
                points={[...employee.monthlyHistory]
                  .reverse()
                  .slice(-12)
                  .map((m) => ({ year: m.year, month: m.month, value: m.netPoints }))}
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
                    <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-right tabular-nums">
                      <span>
                        <span className="font-bold text-foreground">
                          {m.positivePoints > 0 ? "+" : ""}
                          {m.positivePoints}
                        </span>{" "}
                        <span className="text-xs text-muted">positive</span>
                      </span>
                      <span>
                        <span className={`font-bold ${m.negativePoints > 0 ? "text-negative" : "text-foreground"}`}>
                          {m.negativePoints > 0 ? "−" : ""}
                          {m.negativePoints}
                        </span>{" "}
                        <span className="text-xs text-muted">negative</span>
                      </span>
                      <span className={`font-bold ${m.netPoints < 0 ? "text-negative" : "text-brand"}`}>
                        {m.netPoints >= 0 ? "+" : ""}
                        {m.netPoints} net
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
