import { getPointEvents } from "@/lib/queries";
import { getCategoryLabel } from "@/lib/scoring/point-categories";
import { xlsxResponse } from "@/lib/export";

/** Every point event ever recorded — the "Export All History" button. */
export async function GET() {
  const events = await getPointEvents();

  const rows = events.map((e) => ({
    date: e.eventDate.toLocaleDateString("en-US"),
    employee: e.employeeName,
    department: e.departmentName,
    points: e.points >= 0 ? `+${e.points}` : e.points,
    direction: e.direction,
    category: getCategoryLabel(e.category) ?? "",
    reason: e.reason,
    recordedBy: e.createdByUsername,
  }));

  return xlsxResponse("team-points-full-history.xlsx", [
    {
      name: "Point History",
      columns: [
        { header: "Date", key: "date", width: 14 },
        { header: "Employee", key: "employee", width: 24 },
        { header: "Department", key: "department", width: 20 },
        { header: "Points", key: "points", width: 10 },
        { header: "Positive/Negative", key: "direction", width: 16 },
        { header: "Category", key: "category", width: 22 },
        { header: "Reason", key: "reason", width: 40 },
        { header: "Recorded By", key: "recordedBy", width: 18 },
      ],
      rows,
    },
  ]);
}
