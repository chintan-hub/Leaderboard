import "server-only";
import { prisma } from "@/lib/db";
import {
  computeDepartmentRanking,
  rankDepartments,
  type DepartmentRankingResult,
} from "@/lib/scoring/department";
import { computeRankMovement, rankEmployees, type RankMovement } from "@/lib/scoring/leaderboard";
import { filterByMonth } from "@/lib/scoring/monthly";
import { summarizeAllEmployees, summarizeEmployeeScore } from "@/lib/scoring/score";
import { summarizeDailyProduction, type DailyProductionTotals } from "@/lib/scoring/daily";
import type { EmployeeScoreSummary, ScoreTransactionInput, ScoringRule } from "@/lib/scoring/types";

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

/** Maps employeeId -> that employee's department's scoringRule, for feeding the scoring engine. */
async function getScoringRuleByEmployee(): Promise<Map<string, ScoringRule>> {
  const employees = await prisma.employee.findMany({
    select: { id: true, department: { select: { scoringRule: true } } },
  });
  return new Map(employees.map((e) => [e.id, e.department.scoringRule as ScoringRule]));
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
  summary: EmployeeScoreSummary;
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
  scoringRuleByEmployee: Map<string, ScoringRule>,
): Map<string, RankMovement> | null {
  const now = new Date();
  const isLiveCurrentMonth = now.getUTCFullYear() === year && now.getUTCMonth() + 1 === month;
  if (!isLiveCurrentMonth) return null;

  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (todayStart.getUTCDate() === 1) return null;

  const monthTx = filterByMonth(allTransactions, year, month);
  const previousTx = monthTx.filter((tx) => tx.eventDate.getTime() < todayStart.getTime());
  if (previousTx.length === 0) return null;

  const current = rankEmployees(employeeIds, monthTx, scoringRuleByEmployee);
  const previous = rankEmployees(employeeIds, previousTx, scoringRuleByEmployee);
  return computeRankMovement(current, previous);
}

/**
 * The employee leaderboard. Pass {year, month} to scope it to one calendar
 * month (used for "This Month's Leaderboard" and print); omit both for an
 * all-time view. withMovement only has an effect for the live current
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

  const scoringRuleByEmployee = new Map(
    employees.map((e) => [e.id, e.department.scoringRule as ScoringRule]),
  );
  const employeeIds = employees.map((e) => e.id);
  const scopedTransactions =
    year && month ? filterByMonth(allTransactions, year, month) : allTransactions;

  const ranked = rankEmployees(employeeIds, scopedTransactions, scoringRuleByEmployee);

  const movementByEmployee =
    withMovement && year && month
      ? computeCurrentMonthMovement(year, month, employeeIds, allTransactions, scoringRuleByEmployee)
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

/** The department leaderboard. Pass {year, month} to scope it to one calendar month; omit both for all-time. */
export async function getDepartmentLeaderboard(
  options: MonthScope = {},
): Promise<DepartmentRankingResult[]> {
  const [departments, employees, allTransactions] = await Promise.all([
    prisma.department.findMany({ where: { isActive: true } }),
    prisma.employee.findMany({ where: { isActive: true } }),
    getAllTransactions(),
  ]);

  const transactions =
    options.year && options.month
      ? filterByMonth(allTransactions, options.year, options.month)
      : allTransactions;

  const rankingInputs = departments.map((dept) => ({
    departmentId: dept.id,
    departmentName: dept.name,
    rankingMetric: dept.rankingMetric,
    scoringRule: dept.scoringRule as ScoringRule,
    employeeIds: employees.filter((e) => e.departmentId === dept.id).map((e) => e.id),
    transactions,
  }));

  return rankDepartments(rankingInputs);
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
    reason: r.reason,
    eventDate: r.eventDate,
    createdAt: r.createdAt,
    createdByUsername: r.createdByAdmin.username,
    correctsTransactionId: r.correctsTransactionId,
    hasBeenCorrected: r.correctedBy !== null,
  }));
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
  const scoringRuleByEmployee = await getScoringRuleByEmployee();

  return departments.map((dept) => ({
    ...dept,
    employees: dept.employees.map((emp) => ({
      ...emp,
      summary: summarizeEmployeeScore(emp.id, transactions, scoringRuleByEmployee.get(emp.id)),
    })),
  }));
}

export interface EmployeeMonthHistoryRow extends EmployeeMonthSummary {
  employeeId: string;
  employeeName: string;
  departmentName: string;
}

/**
 * Every employee's performance for every month they have activity in —
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
      const s = summarizeEmployeeScore(
        employee.id,
        filterByMonth(own, year, month),
        employee.department.scoringRule as ScoringRule,
      );
      rows.push({
        year,
        month,
        employeeId: employee.id,
        employeeName: employee.name,
        departmentName: employee.department.name,
        casesCompleted: s.casesCompleted,
        casesReturned: s.casesReturned,
        net: s.productionScore,
        manualScore: s.manualScore,
        finalScore: s.finalScore,
      });
    }
  }

  rows.sort(
    (a, b) => b.year - a.year || b.month - a.month || a.employeeName.localeCompare(b.employeeName),
  );
  return rows;
}

/** Active employees in one department, for the production-entry grid and manual-points picker. */
export async function getActiveEmployeesInDepartment(departmentId: string) {
  return prisma.employee.findMany({
    where: { departmentId, isActive: true },
    orderBy: { name: "asc" },
  });
}

function utcDayRange(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
  return { gte: start, lt: end };
}

/** Existing production already recorded for a department on a given date — shown as a heads-up banner, never blocks new entry. */
export async function getExistingProductionSummary(departmentId: string, date: Date) {
  const rows = await prisma.scoreTransaction.findMany({
    where: {
      departmentId,
      eventDate: utcDayRange(date),
      type: { in: ["PRODUCTION_COMPLETED", "PRODUCTION_REWORK"] },
    },
    select: { type: true, cases: true, employeeId: true },
  });
  const completed = rows
    .filter((r) => r.type === "PRODUCTION_COMPLETED")
    .reduce((sum, r) => sum + (r.cases ?? 0), 0);
  const rework = rows
    .filter((r) => r.type === "PRODUCTION_REWORK")
    .reduce((sum, r) => sum + (r.cases ?? 0), 0);
  const employeeCount = new Set(rows.map((r) => r.employeeId)).size;
  return { completed, rework, employeeCount, entryCount: rows.length };
}

/**
 * A day's transactions for every type (not just PRODUCTION_*) — corrections
 * dated that day are included on purpose, since a correction always carries
 * its original transaction's eventDate (see corrections.ts), so this is how
 * "today" stays accurate after an edit.
 */
async function getTransactionsForDay(date: Date): Promise<ScoreTransactionInput[]> {
  const rows = await prisma.scoreTransaction.findMany({
    where: { eventDate: utcDayRange(date) },
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

export interface EmployeeDailyStatus {
  employeeId: string;
  /** True if any production (completed or returned) was recorded for this employee today — not an attendance signal, purely "has today's number been entered". */
  hasEntry: boolean;
  casesCompleted: number;
  casesReturned: number;
  casesReturnedExternal: number;
  net: number;
}

/** Per-employee daily status for one department — powers the ✓/○ completeness indicator and the "already recorded today" detail on the production board. */
export async function getDepartmentDailyStatus(
  departmentId: string,
  date: Date,
): Promise<Map<string, EmployeeDailyStatus>> {
  const [employees, dayTransactions] = await Promise.all([
    prisma.employee.findMany({ where: { departmentId, isActive: true }, select: { id: true } }),
    getTransactionsForDay(date),
  ]);

  const deptDayTransactions = dayTransactions.filter((t) => t.departmentId === departmentId);
  const summaries = summarizeAllEmployees(deptDayTransactions);

  const result = new Map<string, EmployeeDailyStatus>();
  for (const emp of employees) {
    const s = summaries.get(emp.id);
    const casesCompleted = s?.casesCompleted ?? 0;
    const casesReturned = s?.casesReturned ?? 0;
    const casesReturnedExternal = s?.casesReturnedExternal ?? 0;
    result.set(emp.id, {
      employeeId: emp.id,
      hasEntry: casesCompleted > 0 || casesReturned > 0 || casesReturnedExternal > 0,
      casesCompleted,
      casesReturned,
      casesReturnedExternal,
      net: casesCompleted - casesReturned,
    });
  }
  return result;
}

/** Today's department totals vs. yesterday's — a plain, always-computable comparison (yesterday existing with zero production is still real data, not "insufficient"). */
export async function getDepartmentDailyComparison(
  departmentId: string,
  date: Date,
): Promise<{ today: DailyProductionTotals; yesterday: DailyProductionTotals }> {
  const yesterday = new Date(date);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const [todayTx, yesterdayTx] = await Promise.all([
    getTransactionsForDay(date),
    getTransactionsForDay(yesterday),
  ]);

  return {
    today: summarizeDailyProduction(todayTx.filter((t) => t.departmentId === departmentId)),
    yesterday: summarizeDailyProduction(yesterdayTx.filter((t) => t.departmentId === departmentId)),
  };
}

export interface EmployeeMonthSummary {
  year: number;
  month: number;
  casesCompleted: number;
  casesReturned: number;
  net: number;
  manualScore: number;
  finalScore: number;
}

export interface EmployeeDetail {
  id: string;
  name: string;
  isActive: boolean;
  departmentId: string;
  departmentName: string;
  joinedAt: Date;
  summary: EmployeeScoreSummary;
  /**
   * Every calendar month this employee has any recorded activity in, newest
   * first — nothing is capped or dropped, so history stays reachable years
   * later. Each month is recomputed from the ledger the same way the
   * monthly leaderboard is, so it always agrees with "This Month" elsewhere.
   */
  monthlyHistory: EmployeeMonthSummary[];
}

/** Everything for the employee detail page: all-time summary plus a month-by-month history, going back as far as the ledger does. */
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

  const scoringRule = employee.department.scoringRule as ScoringRule;
  const summary = summarizeEmployeeScore(employeeId, rows, scoringRule);

  const monthKeys = Array.from(
    new Set(rows.map((r) => `${r.eventDate.getUTCFullYear()}-${r.eventDate.getUTCMonth() + 1}`)),
  )
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);

  const monthlyHistory = monthKeys.map(({ year, month }) => {
    const s = summarizeEmployeeScore(employeeId, filterByMonth(rows, year, month), scoringRule);
    return {
      year,
      month,
      casesCompleted: s.casesCompleted,
      casesReturned: s.casesReturned,
      net: s.productionScore,
      manualScore: s.manualScore,
      finalScore: s.finalScore,
    };
  });

  return {
    id: employee.id,
    name: employee.name,
    isActive: employee.isActive,
    departmentId: employee.departmentId,
    departmentName: employee.department.name,
    joinedAt: employee.joinedAt,
    summary,
    monthlyHistory,
  };
}

export interface DailyProductionReport {
  date: Date;
  lab: DailyProductionTotals;
  departments: Array<{
    departmentId: string;
    departmentName: string;
    totals: DailyProductionTotals;
    employees: Array<{ employeeId: string; name: string; completed: number; rework: number; net: number }>;
  }>;
}

/** Lab-wide daily production report — company total, per-department totals, and per-employee breakdown for departments that had activity. Powers "Print Today's Production". */
export async function getDailyProductionReport(date: Date): Promise<DailyProductionReport> {
  const [departments, dayTransactions] = await Promise.all([
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { employees: { where: { isActive: true }, orderBy: { name: "asc" } } },
    }),
    getTransactionsForDay(date),
  ]);

  const departmentReports = departments.map((dept) => {
    const deptTransactions = dayTransactions.filter((t) => t.departmentId === dept.id);
    const totals = summarizeDailyProduction(deptTransactions);
    const employeeSummaries = summarizeAllEmployees(deptTransactions);

    const employees = dept.employees
      .map((emp) => {
        const s = employeeSummaries.get(emp.id);
        const completed = s?.casesCompleted ?? 0;
        const rework = s?.casesReturned ?? 0;
        return { employeeId: emp.id, name: emp.name, completed, rework, net: completed - rework };
      })
      .filter((e) => e.completed > 0 || e.rework > 0);

    return { departmentId: dept.id, departmentName: dept.name, totals, employees };
  });

  return { date, lab: summarizeDailyProduction(dayTransactions), departments: departmentReports };
}

export interface DepartmentDrilldown {
  department: NonNullable<Awaited<ReturnType<typeof getDepartmentById>>>;
  ranking: DepartmentRankingResult;
  employees: Array<{ employeeId: string; name: string; rank: number; summary: EmployeeScoreSummary }>;
}

/** A department's own employee ranking, optionally scoped to one calendar month — the "clicking a department reveals its employees" drill-down. */
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

  const scoringRule = department.scoringRule as ScoringRule;
  const employeeIds = employees.map((e) => e.id);
  const ranked = rankEmployees(
    employeeIds,
    transactions,
    new Map(employeeIds.map((id) => [id, scoringRule])),
  );
  const employeeById = new Map(employees.map((e) => [e.id, e]));

  const ranking = computeDepartmentRanking({
    departmentId: department.id,
    departmentName: department.name,
    rankingMetric: department.rankingMetric,
    scoringRule,
    employeeIds,
    transactions,
  });

  return {
    department,
    ranking,
    employees: ranked.map((r) => ({
      employeeId: r.employeeId,
      name: employeeById.get(r.employeeId)!.name,
      rank: r.rank,
      summary: r.summary,
    })),
  };
}
