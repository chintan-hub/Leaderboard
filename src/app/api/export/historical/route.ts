import { getAllEmployeesMonthlyHistory } from "@/lib/queries";
import { xlsxResponse } from "@/lib/export";

function monthName(month: number): string {
  return new Date(Date.UTC(2000, month - 1, 1)).toLocaleDateString("en-US", { month: "long" });
}

/** Every employee's performance for every month on record — the "export all history" button. */
export async function GET() {
  const history = await getAllEmployeesMonthlyHistory();

  const rows = history.map((r) => ({
    year: r.year,
    month: monthName(r.month),
    employee: r.employeeName,
    department: r.departmentName,
    casesCompleted: r.casesCompleted,
    casesReturned: r.casesReturned,
    netCases: r.net,
    manualPoints: r.manualScore,
    finalScore: r.finalScore,
  }));

  return xlsxResponse("lab-leaderboard-full-history.xlsx", [
    {
      name: "Monthly History",
      columns: [
        { header: "Year", key: "year", width: 8 },
        { header: "Month", key: "month", width: 12 },
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
