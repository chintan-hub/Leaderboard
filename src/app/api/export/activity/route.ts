import { getRecentActivity } from "@/lib/queries";
import { xlsxResponse } from "@/lib/export";

const TYPE_LABEL: Record<string, string> = {
  PRODUCTION_COMPLETED: "Completed",
  PRODUCTION_REWORK: "Returned",
  MANUAL_BONUS: "Manual +1",
  MANUAL_DEDUCTION: "Manual -1",
  CORRECTION: "Correction",
};

/** The detailed, underlying transaction ledger — every score-changing event, exported as-is. */
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
    cases: r.cases,
    points: r.points,
    responsibility: r.responsibility ?? "",
    reason: r.reason,
    recordedBy: r.createdByUsername,
    corrected: r.hasBeenCorrected ? "Yes" : "",
  }));

  return xlsxResponse("lab-leaderboard-activity.xlsx", [
    {
      name: "Activity",
      columns: [
        { header: "Date", key: "date", width: 14 },
        { header: "Type", key: "type", width: 14 },
        { header: "Employee", key: "employee", width: 24 },
        { header: "Department", key: "department", width: 20 },
        { header: "Cases", key: "cases", width: 10 },
        { header: "Points", key: "points", width: 10 },
        { header: "Responsibility", key: "responsibility", width: 20 },
        { header: "Reason", key: "reason", width: 36 },
        { header: "Recorded By", key: "recordedBy", width: 18 },
        { header: "Corrected?", key: "corrected", width: 12 },
      ],
      rows,
    },
  ]);
}
