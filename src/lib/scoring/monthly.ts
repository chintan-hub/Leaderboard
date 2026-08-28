import { summarizeEmployeeScore } from "./score";
import type { EmployeeScoreSummary, ScoreTransactionInput, ScoringRule } from "./types";

/** True if `date` falls within the given calendar month (1-12), in UTC. */
export function isInMonth(date: Date, year: number, month: number): boolean {
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month;
}

/**
 * Restricts a transaction list to one calendar month. This is the only
 * mechanism used for month isolation — scores are never carried or rolled
 * over, they're simply recomputed from whatever happened inside the
 * boundary. Past months stay available forever since nothing is deleted.
 */
export function filterByMonth(
  transactions: ScoreTransactionInput[],
  year: number,
  month: number,
): ScoreTransactionInput[] {
  return transactions.filter((tx) => isInMonth(tx.eventDate, year, month));
}

export interface EmployeeOfMonthCandidate {
  employeeId: string;
  summary: EmployeeScoreSummary;
}

export type EmployeeOfMonthResult =
  | { status: "none"; year: number; month: number }
  | {
      status: "winner";
      year: number;
      month: number;
      winner: EmployeeOfMonthCandidate;
      tieBrokenBy: "final_score" | "cases_completed" | "fewer_returns" | null;
    }
  | {
      status: "tie";
      year: number;
      month: number;
      tiedCandidates: EmployeeOfMonthCandidate[];
    };

/**
 * Employee of the Month = highest final score for the month, among
 * eligible (active) employees who have at least one transaction that month.
 *
 * Ties are broken deterministically and transparently, in order:
 *   1. Highest final score (the primary rule)
 *   2. Highest cases completed (raw production volume) — rewards output
 *   3. Fewest cases returned (employee-caused) — rewards quality
 * If candidates are still tied after all three, NO winner is silently
 * picked: the result reports `status: "tie"` with every tied candidate, and
 * an admin must resolve it manually (recorded like any other decision).
 */
export function computeEmployeeOfMonth(
  eligibleEmployeeIds: string[],
  transactions: ScoreTransactionInput[],
  year: number,
  month: number,
  scoringRuleByEmployee?: Map<string, ScoringRule>,
): EmployeeOfMonthResult {
  const monthTx = filterByMonth(transactions, year, month);
  const participatingIds = new Set(monthTx.map((tx) => tx.employeeId));

  const candidates: EmployeeOfMonthCandidate[] = eligibleEmployeeIds
    .filter((id) => participatingIds.has(id))
    .map((employeeId) => ({
      employeeId,
      summary: summarizeEmployeeScore(
        employeeId,
        monthTx,
        scoringRuleByEmployee?.get(employeeId) ?? "NET_PRODUCTION",
      ),
    }));

  if (candidates.length === 0) {
    return { status: "none", year, month };
  }

  const rank = (list: EmployeeOfMonthCandidate[]) => {
    const max = Math.max(...list.map((c) => c.summary.finalScore));
    return list.filter((c) => c.summary.finalScore === max);
  };

  const tied = rank(candidates);
  if (tied.length === 1) {
    return {
      status: "winner",
      year,
      month,
      winner: tied[0],
      tieBrokenBy: null,
    };
  }

  const byCasesCompleted = (list: EmployeeOfMonthCandidate[]) => {
    const max = Math.max(...list.map((c) => c.summary.casesCompleted));
    return list.filter((c) => c.summary.casesCompleted === max);
  };
  const tiedByCases = byCasesCompleted(tied);
  if (tiedByCases.length === 1) {
    return {
      status: "winner",
      year,
      month,
      winner: tiedByCases[0],
      tieBrokenBy: "cases_completed",
    };
  }

  const byFewestReturns = (list: EmployeeOfMonthCandidate[]) => {
    const min = Math.min(...list.map((c) => c.summary.casesReturned));
    return list.filter((c) => c.summary.casesReturned === min);
  };
  const tiedByReturns = byFewestReturns(tiedByCases);
  if (tiedByReturns.length === 1) {
    return {
      status: "winner",
      year,
      month,
      winner: tiedByReturns[0],
      tieBrokenBy: "fewer_returns",
    };
  }

  return { status: "tie", year, month, tiedCandidates: tiedByReturns };
}
