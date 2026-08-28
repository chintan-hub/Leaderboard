import { summarizeEmployeeScore } from "./score";
import type { EmployeeScoreSummary, ScoreTransactionInput, ScoringRule } from "./types";

export interface RankedEmployee {
  employeeId: string;
  rank: number;
  summary: EmployeeScoreSummary;
}

/**
 * Ranks every given employee by final score, highest first. Every employee
 * id passed in gets a rank — including ones with zero activity, ranked
 * (tied) at the bottom — so the leaderboard always shows the full roster
 * rather than silently dropping people who haven't logged anything yet.
 * Ties are broken by employeeId so relative order is stable across calls,
 * which matters for rank-movement comparisons (see computeRankMovement).
 */
export function rankEmployees(
  employeeIds: string[],
  transactions: ScoreTransactionInput[],
  scoringRuleByEmployee?: Map<string, ScoringRule>,
): RankedEmployee[] {
  const sorted = [...employeeIds].sort((a, b) => a.localeCompare(b));
  const summaries = sorted.map((employeeId) => ({
    employeeId,
    summary: summarizeEmployeeScore(
      employeeId,
      transactions,
      scoringRuleByEmployee?.get(employeeId) ?? "NET_PRODUCTION",
    ),
  }));

  summaries.sort((a, b) => b.summary.finalScore - a.summary.finalScore);

  return summaries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export interface RankMovement {
  /** Positive = moved up (improved rank), negative = moved down, 0 = unchanged. */
  delta: number;
  previousRank: number;
  currentRank: number;
}

/**
 * Compares two rankings of the SAME employee set and returns each
 * employee's movement. Only call this when both rankings are reliably
 * comparable (same roster, same month, previous snapshot actually has
 * data) — the caller decides that, this function just diffs two lists.
 */
export function computeRankMovement(
  current: RankedEmployee[],
  previous: RankedEmployee[],
): Map<string, RankMovement> {
  const previousRankById = new Map(previous.map((e) => [e.employeeId, e.rank]));
  const result = new Map<string, RankMovement>();

  for (const entry of current) {
    const previousRank = previousRankById.get(entry.employeeId);
    if (previousRank === undefined) continue;
    result.set(entry.employeeId, {
      delta: previousRank - entry.rank,
      previousRank,
      currentRank: entry.rank,
    });
  }

  return result;
}
