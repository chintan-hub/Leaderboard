import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getDepartments } from "@/lib/queries";
import { Badge, Card, SectionTitle } from "@/components/ui";
import NewDepartmentForm from "./new-department-form";
import EditDepartmentForm from "./edit-department-form";

const SCORING_RULE_LABEL: Record<string, string> = {
  NET_PRODUCTION: "Net Production",
  MANUAL_POINTS_ONLY: "Manual Points Only",
};

const RANKING_METRIC_LABEL: Record<string, string> = {
  AVG_NET_PER_EMPLOYEE: "Average Net Production per Employee",
  TOTAL_NET_PRODUCTION: "Total Net Production",
};

export default async function DepartmentsPage() {
  const [departments, admin] = await Promise.all([getDepartments(), getCurrentAdmin()]);

  return (
    <div className="space-y-8">
      <SectionTitle subtitle="1 unit of production = 1 case, no matter how many teeth it contains. Click a department to see this month's standings.">
        Departments
      </SectionTitle>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Card
            key={dept.id}
            className="transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-surface-raised"
          >
            <div className="flex items-start justify-between">
              <Link
                href={`/departments/${dept.id}`}
                className="focus-ring rounded text-lg font-extrabold text-foreground hover:text-brand"
              >
                {dept.name}
              </Link>
              {!dept.isActive && <Badge tone="neutral">Inactive</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted">
              {dept._count.employees} {dept._count.employees === 1 ? "employee" : "employees"}
            </p>
            <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs text-muted">
              <div className="flex justify-between">
                <dt>Scoring method</dt>
                <dd className="text-right text-foreground/80">
                  {SCORING_RULE_LABEL[dept.scoringRule] ?? dept.scoringRule}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Ranking</dt>
                <dd className="text-right text-foreground/80">
                  {RANKING_METRIC_LABEL[dept.rankingMetric] ?? dept.rankingMetric}
                </dd>
              </div>
              {!dept.productionTrackingEnabled && (
                <div className="text-info">Production tracking off</div>
              )}
              {!dept.reworkTrackingEnabled && (
                <div className="text-info">Rework tracking off</div>
              )}
            </dl>

            {admin && (
              <details className="group mt-3">
                <summary className="focus-ring inline-block cursor-pointer rounded text-xs font-semibold text-muted transition hover:text-brand">
                  Edit settings
                </summary>
                <EditDepartmentForm
                  department={{
                    id: dept.id,
                    name: dept.name,
                    scoringRule: dept.scoringRule,
                    rankingMetric: dept.rankingMetric,
                    productionTrackingEnabled: dept.productionTrackingEnabled,
                    reworkTrackingEnabled: dept.reworkTrackingEnabled,
                  }}
                />
              </details>
            )}
          </Card>
        ))}
      </div>

      {admin && (
        <section className="max-w-md">
          <SectionTitle subtitle="New departments start with the standard net-production scoring rule.">
            Add a Department
          </SectionTitle>
          <NewDepartmentForm />
        </section>
      )}
    </div>
  );
}
