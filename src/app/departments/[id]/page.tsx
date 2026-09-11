import Link from "next/link";
import { notFound } from "next/navigation";
import { getDepartmentDrilldown } from "@/lib/queries";
import { Card, EmptyState, RankBadge, SectionTitle } from "@/components/ui";

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function DepartmentDrilldownPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const drilldown = await getDepartmentDrilldown(id, { year, month });
  if (!drilldown) notFound();

  const { department, points, employees } = drilldown;

  return (
    <div className="space-y-6">
      <Link
        href="/departments"
        className="focus-ring inline-flex items-center gap-1 rounded text-sm font-semibold text-muted hover:text-brand"
      >
        ← All Departments
      </Link>

      <SectionTitle eyebrow="This Month" subtitle={monthLabel(year, month)}>
        {department.name}
      </SectionTitle>

      <Card raised>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex gap-8">
            <div>
              <div className="score-lg text-2xl text-positive">
                {points.positivePoints > 0 ? "+" : ""}
                {points.positivePoints}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Positive</div>
            </div>
            <div>
              <div className={`score-lg text-2xl ${points.negativePoints > 0 ? "text-negative" : "text-foreground"}`}>
                {points.negativePoints > 0 ? "−" : ""}
                {points.negativePoints}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Negative</div>
            </div>
          </div>
          <div className="text-right">
            <div className="score-hero text-3xl text-brand">
              {points.netPoints >= 0 ? "+" : ""}
              {points.netPoints}
            </div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted">Net Points</div>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          {department.name} employees this month
        </h3>
        {employees.length === 0 ? (
          <EmptyState title="No employees yet" description="Add employees to this department to see them here." />
        ) : (
          <Card className="p-0">
            <ul className="divide-y divide-border">
              {employees.map((emp) => (
                <li
                  key={emp.employeeId}
                  className="list-row flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <RankBadge rank={emp.rank} size="sm" />
                    <Link
                      href={`/employees/${emp.employeeId}`}
                      className="focus-ring rounded font-bold text-foreground hover:text-brand hover:underline"
                    >
                      {emp.name}
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-right text-sm">
                    <div>
                      <div className="font-bold tabular-nums text-foreground">
                        {emp.summary.positivePoints > 0 ? "+" : ""}
                        {emp.summary.positivePoints}
                      </div>
                      <div className="text-[10px] uppercase text-muted">Positive</div>
                    </div>
                    <div>
                      <div
                        className={`font-bold tabular-nums ${emp.summary.negativePoints > 0 ? "text-negative" : "text-foreground"}`}
                      >
                        {emp.summary.negativePoints > 0 ? "−" : ""}
                        {emp.summary.negativePoints}
                      </div>
                      <div className="text-[10px] uppercase text-muted">Negative</div>
                    </div>
                    <div className="w-14">
                      <div className="score-md text-xl text-brand">
                        {emp.summary.netPoints >= 0 ? "+" : ""}
                        {emp.summary.netPoints}
                      </div>
                      <div className="text-[10px] uppercase text-muted">Net</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
