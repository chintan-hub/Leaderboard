import { getEmployeeLeaderboard } from "@/lib/queries";
import { xlsxResponse } from "@/lib/export";

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Monthly employee-performance summary — the "export this month" button on Monthly Results. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getUTCFullYear();
  const month = Number(searchParams.get("month")) || now.getUTCMonth() + 1;

  const leaderboard = await getEmployeeLeaderboard({ year, month });

  const rows = leaderboard.map((r) => ({
    rank: r.rank,
    employee: r.name,
    department: r.departmentName,
    casesCompleted: r.summary.casesCompleted,
    casesReturned: r.summary.casesReturned,
    netCases: r.summary.productionScore,
    manualPoints: r.summary.manualScore,
    finalScore: r.summary.finalScore,
  }));

  return xlsxResponse(`lab-leaderboard-${year}-${String(month).padStart(2, "0")}.xlsx`, [
    {
      name: monthLabel(year, month).slice(0, 31),
      columns: [
        { header: "Rank", key: "rank", width: 8 },
        { header: "Employee", key: "employee", width: 24 },
        { header: "Department", key: "department", width: 20 },
        { header: "Cases Completed", key: "casesCompleted", width: 16 },
        { header: "Cases Returned", key: "casesReturned", width: 16 },
        { header: "Net Cases", key: "netCases", width: 12 },
        { header: "Manual Points", key: "manualPoints", width: 14 },
        { header: "Final Score", key: "finalScore", width: 12 },
      ],
      rows,
    },
  ]);
}
