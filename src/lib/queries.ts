import "server-only";
import { prisma } from "@/lib/db";
import { computeRankMovement, rankEmployees, type RankMovement } from "@/lib/scoring/leaderboard";
import { filterByMonth } from "@/lib/scoring/monthly";
import { summarizeAllEmployees, summarizeEmployeePoints } from "@/lib/scoring/score";
import type { EmployeePointsSummary, ScoreTransactionInput } from "@/lib/scoring/types";

async function getAllTransactions(): Promise<ScoreTransactionInput[]> {
  const rows = await prisma.scoreTransaction.findMany({
    select: {
      id: true,
      type: true,
      employeeId: true,
      departmentId: true,
      cases: true,
      points: true,
      responsibility: true,
      correctionTarget: true,
      eventDate: true,
    },
  });
  return rows;
}

export interface MonthScope {
  year?: number;
  month?: number;
}

export interface EmployeeLeaderboardRow {
  employeeId: string;
  name: string;
  departmentId: string;
  departmentName: string;
  rank: number;
  summary: EmployeePointsSummary;
  movement: RankMovement | null;
}

/**
 * Rank movement vs "yesterday within the same month" — only computed for
 * the live current month, and only when yesterday is still inside it (day
 * 1 has no valid prior day to compare against). Any employee whose
 * comparison isn't reliable simply gets no movement rather than an
 * invented one.
 */
function computeCurrentMonthMovement(
  year: number,
  month: number,
  employeeIds: string[],
  allTransactions: ScoreTransactionInput[],
): Map<string, RankMovement> | null {
  const now = new Date();
  const isLiveCurrentMonth = now.getUTCFullYear() === year && now.getUTCMonth() + 1 === month;
  if (!isLiveCurrentMonth) return null;

  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (todayStart.getUTCDate() === 1) return null;

  const monthTx = filterByMonth(allTransactions, year, month);
  const previousTx = monthTx.filter((tx) => tx.eventDate.getTime() < todayStart.getTime());
  if (previousTx.length === 0) return null;

  const current = rankEmployees(employeeIds, monthTx);
  const previous = rankEmployees(employeeIds, previousTx);
  return computeRankMovement(current, previous);
}

/**
 * The employee standings, ranked by net points. Pass {year, month} to scope
 * it to one calendar month (used for "This Month" and print); omit both for
 * an all-time view. withMovement only has an effect for the live current
 * month — see computeCurrentMonthMovement.
 */
export async function getEmployeeLeaderboard(
  options: MonthScope & { withMovement?: boolean } = {},
): Promise<EmployeeLeaderboardRow[]> {
  const { year, month, withMovement } = options;

  const [employees, allTransactions] = await Promise.all([
    prisma.employee.findMany({ where: { isActive: true }, include: { department: true } }),
    getAllTransactions(),
  ]);

  const employeeIds = employees.map((e) => e.id);
  const scopedTransactions =
    year && month ? filterByMonth(allTransactions, year, month) : allTransactions;

  const ranked = rankEmployees(employeeIds, scopedTransactions);

  const movementByEmployee =
    withMovement && year && month
      ? computeCurrentMonthMovement(year, month, employeeIds, allTransactions)
      : null;

  const employeeById = new Map(employees.map((e) => [e.id, e]));

  return ranked.map((r) => {
    const emp = employeeById.get(r.employeeId)!;
    return {
      employeeId: r.employeeId,
      name: emp.name,
      departmentId: emp.departmentId,
      departmentName: emp.department.name,
      rank: r.rank,
      summary: r.summary,
      movement: movementByEmployee?.get(r.employeeId) ?? null,
    };
  });
}

export interface DepartmentPointsSummary {
  positivePoints: number;
  negativePoints: number;
  netPoints: number;
}

/** Each active department's aggregate points across its active employees, optionally scoped to one calendar month. Powers the points context shown on the Departments list. */
export async function getDepartmentPointsSummaries(
  options: MonthScope = {},
): Promise<Map<string, DepartmentPointsSummary>> {
  const [employees, allTransactions] = await Promise.all([
    prisma.employee.findMany({ where: { isActive: true }, select: { id: true, departmentId: true } }),
    getAllTransactions(),
  ]);

  const transactions =
    options.year && options.month ? filterByMonth(allTransactions, options.year, options.month) : allTransactions;
  const summaries = summarizeAllEmployees(transactions);

  const result = new Map<string, DepartmentPointsSummary>();
  for (const emp of employees) {
    const s = summaries.get(emp.id);
    const prev = result.get(emp.departmentId) ?? { positivePoints: 0, negativePoints: 0, netPoints: 0 };
    result.set(emp.departmentId, {
      positivePoints: prev.positivePoints + (s?.positivePoints ?? 0),
      negativePoints: prev.negativePoints + (s?.negativePoints ?? 0),
      netPoints: prev.netPoints + (s?.netPoints ?? 0),
    });
  }
  return result;
}

export interface RecentActivityRow {
  id: string;
  type: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  departmentId: string;
  cases: number | null;
  points: number | null;
  responsibility: string | null;
  correctionTarget: string | null;
  category: string | null;
  reason: string;
  eventDate: Date;
  createdAt: Date;
  createdByUsername: string;
  correctsTransactionId: string | null;
  hasBeenCorrected: boolean;
}

export interface ActivityFilters {
  departmentId?: string;
  employeeId?: string;
  /** Restrict to a single calendar day. */
  date?: Date;
  limit?: number;
}

/** The full point-event audit trail — every score-changing event ever recorded, newest first. Nothing is ever excluded or hidden here, including legacy production-era rows. */
export async function getRecentActivity(
  filtersOrLimit: ActivityFilters | number = {},
): Promise<RecentActivityRow[]> {
  const filters: ActivityFilters =
    typeof filtersOrLimit === "number" ? { limit: filtersOrLimit } : filtersOrLimit;

  const dateRange = filters.date
    ? {
        gte: new Date(
          Date.UTC(filters.date.getUTCFullYear(), filters.date.getUTCMonth(), filters.date.getUTCDate()),
        ),
        lt: new Date(
          Date.UTC(filters.date.getUTCFullYear(), filters.date.getUTCMonth(), filters.date.getUTCDate() + 1),
        ),
      }
    : undefined;

  const rows = await prisma.scoreTransaction.findMany({
    where: {
      departmentId: filters.departmentId,
      employeeId: filters.employeeId,
      eventDate: dateRange,
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 50,
    include: {
      employee: { select: { name: true } },
      department: { select: { name: true } },
      createdByAdmin: { select: { username: true } },
      correctedBy: { select: { id: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    employeeId: r.employeeId,
    employeeName: r.employee.name,
    departmentName: r.department.name,
    departmentId: r.departmentId,
    cases: r.cases,
    points: r.points,
    responsibility: r.responsibility,
    correctionTarget: r.correctionTarget,
    category: r.category,
    reason: r.reason,
    eventDate: r.eventDate,
    createdAt: r.createdAt,
    createdByUsername: r.createdByAdmin.username,
    correctsTransactionId: r.correctsTransactionId,
    hasBeenCorrected: r.correctedBy !== null,
  }));
}

export interface PointEventRow {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  eventDate: Date;
  /** Signed contribution: +1 for a recognition, -1 for a deduction, or a correction's own delta. */
  points: number;
  direction: "Positive" | "Negative";
  category: string | null;
  reason: string;
  createdByUsername: string;
}

/**
 * Every point event (recognitions, deductions, and corrections of either) —
 * excludes legacy production rows entirely, since those were never part of
 * the points system. Powers the "Export This Month" / "Export All History"
 * spreadsheets. Pass {year, month} to scope to one calendar month; omit
 * both for all-time.
 */
export async function getPointEvents(options: MonthScope = {}): Promise<PointEventRow[]> {
  const dateRange =
    options.year && options.month
      ? {
          gte: new Date(Date.UTC(options.year, options.month - 1, 1)),
          lt: new Date(Date.UTC(options.year, options.month, 1)),
        }
      : undefined;

  const rows = await prisma.scoreTransaction.findMany({
    where: {
      eventDate: dateRange,
      type: { in: ["MANUAL_BONUS", "MANUAL_DEDUCTION", "CORRECTION"] },
    },
    orderBy: { eventDate: "desc" },
    include: {
      employee: { select: { name: true } },
      department: { select: { name: true } },
      createdByAdmin: { select: { username: true } },
    },
  });

  return rows
    .filter(
      (r) =>
        r.type !== "CORRECTION" ||
        r.correctionTarget === "MANUAL_BONUS" ||
        r.correctionTarget === "MANUAL_DEDUCTION",
    )
    .map((r) => {
      const points = r.type === "MANUAL_BONUS" ? 1 : r.type === "MANUAL_DEDUCTION" ? -1 : (r.points ?? 0);
      return {
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employee.name,
        departmentName: r.department.name,
        eventDate: r.eventDate,
        points,
        direction: points >= 0 ? ("Positive" as const) : ("Negative" as const),
        category: r.category,
        reason: r.reason,
        createdByUsername: r.createdByAdmin.username,
      };
    });
}

export async function getTransactionForCorrection(id: string) {
  const original = await prisma.scoreTransaction.findUnique({
    where: { id },
    include: {
      employee: { select: { name: true } },
      department: { select: { name: true } },
      createdByAdmin: { select: { username: true } },
      correctedBy: { select: { id: true } },
    },
  });
  return original;
}

export async function getDepartments() {
  return prisma.department.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { employees: true } } },
  });
}

export async function getDepartmentById(id: string) {
  return prisma.department.findUnique({ where: { id } });
}

export async function getEmployeesByDepartment() {
  const departments = await prisma.department.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      employees: { orderBy: { name: "asc" } },
    },
  });
  const transactions = await getAllTransactions();

  return departments.map((dept) => ({
    ...dept,
    employees: dept.employees.map((emp) => ({
      ...emp,
      summary: summarizeEmployeePoints(emp.id, transactions),
    })),
  }));
}

export interface EmployeeMonthPoints {
  year: number;
  month: number;
  positivePoints: number;
  negativePoints: number;
  netPoints: number;
  /** Number of individual point events (recognitions + deductions) this month. */
  eventCount: number;
}

export interface EmployeeMonthHistoryRow extends EmployeeMonthPoints {
  employeeId: string;
  employeeName: string;
  departmentName: string;
}

/**
 * Every employee's points for every month they have a point event in —
 * including inactive employees, since deactivating someone must never erase
 * their history. Powers the "export all history" spreadsheet. Newest month
 * first, then employee name.
 */
export async function getAllEmployeesMonthlyHistory(): Promise<EmployeeMonthHistoryRow[]> {
  const [employees, allTransactions] = await Promise.all([
    prisma.employee.findMany({ include: { department: true }, orderBy: { name: "asc" } }),
    getAllTransactions(),
  ]);

  const rows: EmployeeMonthHistoryRow[] = [];

  for (const employee of employees) {
    const own = allTransactions.filter((t) => t.employeeId === employee.id);
    const monthKeys = Array.from(
      new Set(own.map((t) => `${t.eventDate.getUTCFullYear()}-${t.eventDate.getUTCMonth() + 1}`)),
    ).map((key) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month };
    });

    for (const { year, month } of monthKeys) {
      const s = summarizeEmployeePoints(employee.id, filterByMonth(own, year, month));
      // A month whose only activity is legacy production (no point events)
      // has nothing left to report under the points system — skip it.
      if (s.recognitionCount === 0 && s.deductionCount === 0 && s.netPoints === 0) continue;
      rows.push({
        year,
        month,
        employeeId: employee.id,
        employeeName: employee.name,
        departmentName: employee.department.name,
        positivePoints: s.positivePoints,
        negativePoints: s.negativePoints,
        netPoints: s.netPoints,
        eventCount: s.recognitionCount + s.deductionCount,
      });
    }
  }

  rows.sort(
    (a, b) => b.year - a.year || b.month - a.month || a.employeeName.localeCompare(b.employeeName),
  );
  return rows;
}

export interface EmployeeDetail {
  id: string;
  name: string;
  isActive: boolean;
  departmentId: string;
  departmentName: string;
  joinedAt: Date;
  /** All-time totals. */
  summary: EmployeePointsSummary;
  /** The current calendar month's totals — zeroed out (not omitted) when there's no activity yet this month. */
  currentMonth: EmployeePointsSummary;
  /**
   * Every calendar month this employee has a point event in, newest first —
   * nothing is capped or dropped, so history stays reachable years later.
   * Each month is recomputed from the ledger the same way Monthly Results
   * is, so it always agrees with "This Month" elsewhere.
   */
  monthlyHistory: EmployeeMonthPoints[];
}

/** Everything for the employee detail page: all-time summary, this month's summary, and a month-by-month history, going back as far as the ledger does. */
export async function getEmployeeDetail(employeeId: string): Promise<EmployeeDetail | null> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { department: true },
  });
  if (!employee) return null;

  const rows = await prisma.scoreTransaction.findMany({
    where: { employeeId },
    select: {
      id: true,
      type: true,
      employeeId: true,
      departmentId: true,
      cases: true,
      points: true,
      responsibility: true,
      correctionTarget: true,
      eventDate: true,
    },
    orderBy: { eventDate: "desc" },
  });

  const summary = summarizeEmployeePoints(employeeId, rows);

  const now = new Date();
  const currentMonth = summarizeEmployeePoints(
    employeeId,
    filterByMonth(rows, now.getUTCFullYear(), now.getUTCMonth() + 1),
  );

  const monthKeys = Array.from(
    new Set(rows.map((r) => `${r.eventDate.getUTCFullYear()}-${r.eventDate.getUTCMonth() + 1}`)),
  )
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);

  const monthlyHistory = monthKeys
    .map(({ year, month }) => {
      const s = summarizeEmployeePoints(employeeId, filterByMonth(rows, year, month));
      return {
        year,
        month,
        positivePoints: s.positivePoints,
        negativePoints: s.negativePoints,
        netPoints: s.netPoints,
        eventCount: s.recognitionCount + s.deductionCount,
      };
    })
    // A month whose only activity is legacy production has no points to show.
    .filter((m) => m.eventCount > 0 || m.netPoints !== 0);

  return {
    id: employee.id,
    name: employee.name,
    isActive: employee.isActive,
    departmentId: employee.departmentId,
    departmentName: employee.department.name,
    joinedAt: employee.joinedAt,
    summary,
    currentMonth,
    monthlyHistory,
  };
}

export interface DepartmentDrilldown {
  department: NonNullable<Awaited<ReturnType<typeof getDepartmentById>>>;
  points: DepartmentPointsSummary & { averageNetPoints: number };
  employees: Array<{ employeeId: string; name: string; rank: number; summary: EmployeePointsSummary }>;
}

/** A department's own points totals and its employees ranked by net points, optionally scoped to one calendar month — the "clicking a department reveals its employees" drill-down. */
export async function getDepartmentDrilldown(
  departmentId: string,
  options: MonthScope = {},
): Promise<DepartmentDrilldown | null> {
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) return null;

  const employees = await prisma.employee.findMany({
    where: { departmentId, isActive: true },
    orderBy: { name: "asc" },
  });
  const allTransactions = await getAllTransactions();
  const transactions =
    options.year && options.month
      ? filterByMonth(allTransactions, options.year, options.month)
      : allTransactions;

  const employeeIds = employees.map((e) => e.id);
  const ranked = rankEmployees(employeeIds, transactions);
  const employeeById = new Map(employees.map((e) => [e.id, e]));

  const totals = ranked.reduce(
    (acc, r) => ({
      positivePoints: acc.positivePoints + r.summary.positivePoints,
      negativePoints: acc.negativePoints + r.summary.negativePoints,
      netPoints: acc.netPoints + r.summary.netPoints,
    }),
    { positivePoints: 0, negativePoints: 0, netPoints: 0 },
  );

  return {
    department,
    points: {
      ...totals,
      averageNetPoints: employeeIds.length === 0 ? 0 : totals.netPoints / employeeIds.length,
    },
    employees: ranked.map((r) => ({
      employeeId: r.employeeId,
      name: employeeById.get(r.employeeId)!.name,
      rank: r.rank,
      summary: r.summary,
    })),
  };
}
