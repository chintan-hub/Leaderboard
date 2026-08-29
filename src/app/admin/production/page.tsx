import Link from "next/link";
import { prisma } from "@/lib/db";
import { todayIsoUTC } from "@/lib/date";
import {
  getActiveEmployeesInDepartment,
  getDepartmentDailyComparison,
  getDepartmentDailyStatus,
  getExistingProductionSummary,
} from "@/lib/queries";
import { getReworkReasonOptions } from "@/lib/scoring/rework-reasons";
import { SectionTitle } from "@/components/ui";
import { IconPrinter } from "@/components/icons";
import DepartmentDatePicker from "./department-date-picker";
import BulkProductionForm from "./bulk-production-form";
import ProductionEntryForm from "./production-entry-form";

export default async function ProductionEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string; date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date || todayIsoUTC();
  const dateObj = new Date(`${date}T00:00:00Z`);

  const [departments, allActiveEmployees] = await Promise.all([
    prisma.department.findMany({
      where: { isActive: true, productionTrackingEnabled: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { department: { select: { name: true } } },
    }),
  ]);

  const selectedDepartment =
    departments.find((d) => d.id === params.department) ?? departments[0] ?? null;

  const [employees, existingSummary, dailyStatusMap, comparison] = selectedDepartment
    ? await Promise.all([
        getActiveEmployeesInDepartment(selectedDepartment.id),
        getExistingProductionSummary(selectedDepartment.id, dateObj),
        getDepartmentDailyStatus(selectedDepartment.id, dateObj),
        getDepartmentDailyComparison(selectedDepartment.id, dateObj),
      ])
    : [[], null, null, null];

  return (
    <div className="space-y-6">
      <SectionTitle
        subtitle="1 unit of production = 1 case, no matter how many teeth it contains. Pick a department, enter the whole day at once, and save."
        action={
          <Link
            href={`/print/production/${date}`}
            target="_blank"
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand"
          >
            <IconPrinter className="h-4 w-4" />
            Print {date === todayIsoUTC() ? "Today's" : "This Day's"} Production
          </Link>
        }
      >
        Production
      </SectionTitle>

      {departments.length === 0 ? (
        <p className="text-sm text-muted">No departments have production tracking enabled.</p>
      ) : (
        <>
          <DepartmentDatePicker
            departments={departments.map((d) => ({ id: d.id, name: d.name }))}
            selectedDepartmentId={selectedDepartment?.id ?? null}
            date={date}
          />

          {selectedDepartment && dailyStatusMap && comparison && (
            <BulkProductionForm
              key={`${selectedDepartment.id}-${date}`}
              department={{
                id: selectedDepartment.id,
                name: selectedDepartment.name,
                reworkTrackingEnabled: selectedDepartment.reworkTrackingEnabled,
              }}
              date={date}
              employees={employees.map((e) => ({ id: e.id, name: e.name }))}
              reasonOptions={getReworkReasonOptions(selectedDepartment.name)}
              existingSummary={existingSummary}
              dailyStatus={Object.fromEntries(dailyStatusMap)}
              comparison={comparison}
            />
          )}
        </>
      )}

      <details className="group">
        <summary className="focus-ring inline-block cursor-pointer rounded text-sm font-semibold text-muted transition hover:text-brand">
          Need a single entry with a custom note instead?
        </summary>
        <div className="mt-3">
          <ProductionEntryForm
            employees={allActiveEmployees.map((e) => ({
              id: e.id,
              label: `${e.name} — ${e.department.name}`,
            }))}
          />
        </div>
      </details>
    </div>
  );
}
