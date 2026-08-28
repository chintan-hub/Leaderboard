import { summarizeEmployeeScore } from "./score";
import type { ScoreTransactionInput, ScoringRule } from "./types";

export interface DepartmentRankingInput {
  departmentId: string;
  departmentName: string;
  rankingMetric: string;
  /** This department's own scoring rule — shared by every employee in it. Defaults to NET_PRODUCTION. */
  scoringRule?: ScoringRule;
  /** Active employee ids belonging to this department. */
  employeeIds: string[];
  /** All transactions relevant to the period being ranked (e.g. this month, or all-time). */
  transactions: ScoreTransactionInput[];
}

export interface DepartmentRankingResult {
  departmentId: string;
  departmentName: string;
  metricKey: string;
  /** The value departments are sorted by (higher = better). */
  metricValue: number;
  /** Always shown alongside the metric per spec — raw totals should never be hidden. */
  totalProductionScore: number;
  totalCasesCompleted: number;
  totalCasesReturned: number;
  employeeCount: number;
}

type RankingMetricFn = (input: DepartmentRankingInput) => DepartmentRankingResult;

function baseTotals(input: DepartmentRankingInput) {
  const summaries = input.employeeIds.map((id) =>
    summarizeEmployeeScore(id, input.transactions, input.scoringRule ?? "NET_PRODUCTION"),
  );
  return {
    totalProductionScore: summaries.reduce((s, x) => s + x.productionScore, 0),
    totalCasesCompleted: summaries.reduce((s, x) => s + x.casesCompleted, 0),
    totalCasesReturned: summaries.reduce((s, x) => s + x.casesReturned, 0),
  };
}

/**
 * Registry of department ranking formulas, keyed by Department.rankingMetric.
 * Departments have different headcounts, so a raw point total unfairly
 * favors bigger departments — the default metric normalizes by employee
 * count. New formulas can be added here (and assigned to a department via
 * its `rankingMetric` field) without touching the schema.
 */
const RANKING_METRICS: Record<string, RankingMetricFn> = {
  // Default: average net production per employee. Fair across departments
  // of different sizes; total production is still returned for context.
  AVG_NET_PER_EMPLOYEE: (input) => {
    const totals = baseTotals(input);
    const employeeCount = input.employeeIds.length;
    return {
      departmentId: input.departmentId,
      departmentName: input.departmentName,
      metricKey: "AVG_NET_PER_EMPLOYEE",
      metricValue:
        employeeCount === 0 ? 0 : totals.totalProductionScore / employeeCount,
      ...totals,
      employeeCount,
    };
  },

  // Alternative: raw total net production, no normalization. Useful for a
  // department where headcount is fixed/irrelevant to the comparison.
  TOTAL_NET_PRODUCTION: (input) => {
    const totals = baseTotals(input);
    return {
      departmentId: input.departmentId,
      departmentName: input.departmentName,
      metricKey: "TOTAL_NET_PRODUCTION",
      metricValue: totals.totalProductionScore,
      ...totals,
      employeeCount: input.employeeIds.length,
    };
  },
};

export function computeDepartmentRanking(
  input: DepartmentRankingInput,
): DepartmentRankingResult {
  const fn = RANKING_METRICS[input.rankingMetric] ?? RANKING_METRICS.AVG_NET_PER_EMPLOYEE;
  return fn(input);
}

/** Ranks every department, highest metricValue first. */
export function rankDepartments(
  inputs: DepartmentRankingInput[],
): DepartmentRankingResult[] {
  return inputs
    .map(computeDepartmentRanking)
    .sort((a, b) => b.metricValue - a.metricValue);
}
