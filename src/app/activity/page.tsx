import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getRecentActivity } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { Card, EmptyState, PrimaryButton, SectionTitle } from "@/components/ui";

const TYPE_LABEL: Record<string, string> = {
  PRODUCTION_COMPLETED: "Completed",
  PRODUCTION_REWORK: "Returned",
  MANUAL_BONUS: "Manual +1",
  MANUAL_DEDUCTION: "Manual -1",
  CORRECTION: "Correction",
};

const TYPE_TONE: Record<string, string> = {
  PRODUCTION_COMPLETED: "bg-positive-tint text-positive",
  PRODUCTION_REWORK: "bg-negative-tint text-negative",
  MANUAL_BONUS: "bg-sky-50 text-sky-700",
  MANUAL_DEDUCTION: "bg-info-tint text-info",
  CORRECTION: "bg-violet-50 text-violet-700",
};

const CORRECTION_TARGET_LABEL: Record<string, string> = {
  COMPLETED_CASES: "completed cases",
  CASES_RETURNED: "returned cases",
  CASES_RETURNED_EXTERNAL: "returned cases (not charged)",
  MANUAL_BONUS: "manual bonus",
  MANUAL_DEDUCTION: "manual deduction",
};

export default async function ActivityHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string; employeeId?: string; date?: string }>;
}) {
  const params = await searchParams;
  const [admin, departments, employees] = await Promise.all([
    getCurrentAdmin(),
    prisma.department.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, department: { select: { name: true } } },
    }),
  ]);

  const activity = await getRecentActivity({
    departmentId: params.departmentId || undefined,
    employeeId: params.employeeId || undefined,
    date: params.date ? new Date(`${params.date}T00:00:00Z`) : undefined,
    limit: 200,
  });

  const filtered = Boolean(params.departmentId || params.employeeId || params.date);

  return (
    <div className="space-y-6">
      <SectionTitle subtitle="Every score-changing event, immutable and fully traceable. Corrections appear as new entries, never silent edits.">
        Activity History
      </SectionTitle>

      <form
        className="sticky top-16 z-10 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface/95 p-3.5 shadow-surface backdrop-blur-md"
        method="get"
      >
        <div>
          <label htmlFor="departmentId" className="mb-1 block text-xs font-semibold text-muted">
            Department
          </label>
          <select
            id="departmentId"
            name="departmentId"
            defaultValue={params.departmentId ?? ""}
            className="focus-ring rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="employeeId" className="mb-1 block text-xs font-semibold text-muted">
            Employee
          </label>
          <select
            id="employeeId"
            name="employeeId"
            defaultValue={params.employeeId ?? ""}
            className="focus-ring rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">All employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.department.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="mb-1 block text-xs font-semibold text-muted">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={params.date ?? ""}
            className="focus-ring rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
        <PrimaryButton type="submit" className="px-4 py-2">
          Filter
        </PrimaryButton>
        {filtered && (
          <Link
            href="/activity"
            className="focus-ring rounded-lg px-2 py-2 text-sm font-semibold text-muted underline hover:text-foreground"
          >
            Clear filters
          </Link>
        )}
      </form>

      {activity.length === 0 ? (
        <EmptyState
          title={filtered ? "No activity matches these filters" : "No activity yet"}
          description={
            filtered
              ? "Try a different department, employee, or date."
              : "Production entries, rework, and manual points recorded by an admin will show up here."
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="data-table min-w-[820px]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Employee</th>
                <th>Department</th>
                <th className="text-right">Amount</th>
                <th>Reason</th>
                <th>Recorded by</th>
                {admin && <th />}
              </tr>
            </thead>
            <tbody>
              {activity.map((row) => {
                const isCorrection = row.type === "CORRECTION";
                const isNegative =
                  row.type === "MANUAL_DEDUCTION" ||
                  (row.type === "PRODUCTION_REWORK" && row.responsibility === "DEPARTMENT_FAULT") ||
                  (isCorrection && (row.points ?? 0) < 0);
                const amount = isCorrection
                  ? `${(row.points ?? 0) >= 0 ? "+" : ""}${row.points} ${
                      CORRECTION_TARGET_LABEL[row.correctionTarget ?? ""] ?? ""
                    }`
                  : row.type === "PRODUCTION_REWORK" && row.responsibility === "EXTERNAL_NOT_FAULT"
                    ? `${row.cases} (not charged)`
                    : row.cases !== null
                      ? `${isNegative ? "-" : "+"}${row.cases}`
                      : `${isNegative ? "-" : "+"}${row.points}`;
                return (
                  <tr key={row.id} className={isCorrection ? "bg-violet-50/40" : undefined}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-muted">
                      {row.eventDate.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_TONE[row.type]}`}
                      >
                        {TYPE_LABEL[row.type]}
                      </span>
                      {row.correctsTransactionId && !isCorrection && (
                        <span className="ml-2 text-xs font-medium text-muted">correction</span>
                      )}
                      {row.hasBeenCorrected && (
                        <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                          Corrected
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link href={`/employees/${row.employeeId}`} className="hover:text-brand hover:underline">
                        {row.employeeName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{row.departmentName}</td>
                    <td
                      className={`px-4 py-3 text-right font-bold tabular-nums ${
                        isNegative ? "text-negative" : "text-positive"
                      }`}
                    >
                      {amount}
                    </td>
                    <td className="px-4 py-3 text-muted">{row.reason}</td>
                    <td className="px-4 py-3 text-muted">{row.createdByUsername}</td>
                    {admin && (
                      <td className="px-4 py-3 text-right">
                        {!isCorrection && !row.hasBeenCorrected && (
                          <Link
                            href={`/admin/activity/${row.id}/correct`}
                            className="font-semibold text-muted underline hover:text-foreground"
                          >
                            Correct
                          </Link>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
