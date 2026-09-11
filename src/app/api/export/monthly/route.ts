import { getPointEvents } from "@/lib/queries";
import { getCategoryLabel } from "@/lib/scoring/point-categories";
import { xlsxResponse } from "@/lib/export";

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Every point event for one calendar month — the "Export This Month" button on Monthly Results. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getUTCFullYear();
  const month = Number(searchParams.get("month")) || now.getUTCMonth() + 1;

  const events = await getPointEvents({ year, month });

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

  return xlsxResponse(`team-points-${year}-${String(month).padStart(2, "0")}.xlsx`, [
    {
      name: monthLabel(year, month).slice(0, 31),
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
