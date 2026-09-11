import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getDepartmentPointsSummaries, getDepartments } from "@/lib/queries";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { IconEdit } from "@/components/icons";
import NewDepartmentForm from "./new-department-form";
import EditDepartmentForm from "./edit-department-form";
import ArchiveDepartmentButton from "./archive-department-button";
import DeleteDepartmentButton from "./delete-department-button";

export default async function DepartmentsPage() {
  const now = new Date();
  const [departments, admin, pointsByDepartment] = await Promise.all([
    getDepartments(),
    getCurrentAdmin(),
    getDepartmentPointsSummaries({ year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 }),
  ]);

  return (
    <div className="space-y-8">
      <SectionTitle subtitle="Click a department to see this month's standings.">
        Departments
      </SectionTitle>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => {
          const points = pointsByDepartment.get(dept.id) ?? {
            positivePoints: 0,
            negativePoints: 0,
            netPoints: 0,
          };
          return (
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
                  <dt>This month</dt>
                  <dd
                    className={`text-right font-bold tabular-nums ${
                      points.netPoints > 0 ? "text-positive" : points.netPoints < 0 ? "text-negative" : "text-foreground/80"
                    }`}
                  >
                    {points.netPoints >= 0 ? "+" : ""}
                    {points.netPoints} net points
                  </dd>
                </div>
              </dl>

              {admin && (
                <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                  <details className="group">
                    <summary className="focus-ring inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted transition hover:bg-surface-hover hover:text-brand">
                      <IconEdit className="h-3.5 w-3.5" />
                      Edit
                    </summary>
                    <EditDepartmentForm department={{ id: dept.id, name: dept.name }} />
                  </details>
                  <ArchiveDepartmentButton departmentId={dept.id} isActive={dept.isActive} />
                  <DeleteDepartmentButton departmentId={dept.id} departmentName={dept.name} />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {admin && (
        <section className="max-w-md">
          <SectionTitle>Add a Department</SectionTitle>
          <NewDepartmentForm />
        </section>
      )}
    </div>
  );
}
