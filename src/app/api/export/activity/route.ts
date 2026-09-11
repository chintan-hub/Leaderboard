import { getRecentActivity } from "@/lib/queries";
import { getCategoryLabel } from "@/lib/scoring/point-categories";
import { xlsxResponse } from "@/lib/export";

const TYPE_LABEL: Record<string, string> = {
  PRODUCTION_COMPLETED: "Completed (legacy)",
  PRODUCTION_REWORK: "Returned (legacy)",
  MANUAL_BONUS: "Recognition +1",
  MANUAL_DEDUCTION: "Deduction -1",
  CORRECTION: "Correction",
};

/** The full audit trail — every recorded event, exactly as shown on the Activity History page, including legacy production-era rows. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("departmentId") || undefined;
  const employeeId = searchParams.get("employeeId") || undefined;
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(`${dateParam}T00:00:00Z`) : undefined;

  const activity = await getRecentActivity({ departmentId, employeeId, date, limit: 1_000_000 });

  const rows = activity.map((r) => ({
    date: r.eventDate.toLocaleDateString("en-US"),
    type: TYPE_LABEL[r.type] ?? r.type,
    employee: r.employeeName,
    department: r.departmentName,
    category: getCategoryLabel(r.category) ?? "",
    points: r.points,
    cases: r.cases,
    reason: r.reason,
    recordedBy: r.createdByUsername,
    corrected: r.hasBeenCorrected ? "Yes" : "",
  }));

  return xlsxResponse("team-points-activity.xlsx", [
    {
      name: "Activity",
      columns: [
        { header: "Date", key: "date", width: 14 },
        { header: "Type", key: "type", width: 16 },
        { header: "Employee", key: "employee", width: 24 },
        { header: "Department", key: "department", width: 20 },
        { header: "Category", key: "category", width: 22 },
        { header: "Points", key: "points", width: 10 },
        { header: "Cases (legacy)", key: "cases", width: 14 },
        { header: "Reason", key: "reason", width: 36 },
        { header: "Recorded By", key: "recordedBy", width: 18 },
        { header: "Corrected?", key: "corrected", width: 12 },
      ],
      rows,
    },
  ]);
}
