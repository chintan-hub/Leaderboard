import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getEmployeesByDepartment } from "@/lib/queries";
import { Card, EmptyState, SectionTitle } from "@/components/ui";
import NewEmployeeForm from "./new-employee-form";
import EditEmployeeForm from "./edit-employee-form";
import DeactivateButton from "./deactivate-button";

export default async function EmployeesPage() {
  const [departments, admin] = await Promise.all([
    getEmployeesByDepartment(),
    getCurrentAdmin(),
  ]);
  const hasAnyEmployees = departments.some((d) => d.employees.length > 0);
  const departmentOptions = departments.map((d) => ({ id: d.id, name: d.name }));

  return (
    <div className="space-y-8">
      <SectionTitle subtitle="Grouped by department. Final score = Production Score + Manual Bonus/Deduction.">
        Employees
      </SectionTitle>

      {!hasAnyEmployees ? (
        <EmptyState
          title="No employees yet"
          description="Add your first employee below to start tracking production."
        />
      ) : (
        <div className="space-y-6">
          {departments
            .filter((d) => d.employees.length > 0)
            .map((dept) => (
              <section key={dept.id}>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
                  {dept.name}
                </h3>
                <Card className="p-0">
                  <ul className="divide-y divide-border">
                    {dept.employees.map((emp) => (
                      <li key={emp.id} className="px-5 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{emp.name}</span>
                            {!emp.isActive && (
                              <span className="rounded-full bg-silver-tint px-2 py-0.5 text-xs font-semibold text-muted">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-5 text-right text-sm">
                              <div>
                                <div className="font-bold tabular-nums text-foreground">
                                  {emp.summary.productionScore}
                                </div>
                                <div className="text-xs text-muted">Production</div>
                              </div>
                              <div>
                                <div className="font-bold tabular-nums text-foreground">
                                  {emp.summary.manualScore >= 0 ? "+" : ""}
                                  {emp.summary.manualScore}
                                </div>
                                <div className="text-xs text-muted">Manual</div>
                              </div>
                              <div>
                                <div className="font-black tabular-nums text-foreground">
                                  {emp.summary.finalScore}
                                </div>
                                <div className="text-xs text-muted">Final</div>
                              </div>
                            </div>
                            {admin && <DeactivateButton employeeId={emp.id} isActive={emp.isActive} />}
                          </div>
                        </div>
                        {admin && (
                          <details className="group">
                            <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-foreground">
                              Edit
                            </summary>
                            <EditEmployeeForm
                              employee={{ id: emp.id, name: emp.name, departmentId: dept.id }}
                              departments={departmentOptions}
                            />
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            ))}
        </div>
      )}

      {admin && (
        <section className="max-w-md">
          <SectionTitle>Add an Employee</SectionTitle>
          <NewEmployeeForm departments={departmentOptions} />
        </section>
      )}
    </div>
  );
}
