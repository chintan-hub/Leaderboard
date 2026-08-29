import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getEmployeesByDepartment } from "@/lib/queries";
import { Card, EmptyState, ScoreBreakdown, SectionTitle } from "@/components/ui";
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
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                  {dept.name}
                </h3>
                <Card className="p-0" raised>
                  <ul className="divide-y divide-border">
                    {dept.employees.map((emp) => (
                      <li key={emp.id} className="list-row px-5 py-3.5">
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
                            <ScoreBreakdown
                              completed={emp.summary.casesCompleted}
                              rework={emp.summary.casesReturned}
                              manual={emp.summary.manualScore}
                              final={emp.summary.finalScore}
                              size="sm"
                            />
                            {admin && <DeactivateButton employeeId={emp.id} isActive={emp.isActive} />}
                          </div>
                        </div>
                        {admin && (
                          <details className="group">
                            <summary className="focus-ring mt-1 inline-block cursor-pointer rounded text-xs font-semibold text-muted transition hover:text-foreground">
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
