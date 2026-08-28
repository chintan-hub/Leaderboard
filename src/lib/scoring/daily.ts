import { summarizeAllEmployees } from "./score";
import type { ScoreTransactionInput } from "./types";

export function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Restricts a transaction list to one calendar day (UTC), the daily counterpart to filterByMonth. */
export function filterByDate(
  transactions: ScoreTransactionInput[],
  date: Date,
): ScoreTransactionInput[] {
  return transactions.filter((tx) => isSameUtcDay(tx.eventDate, date));
}

export interface DailyProductionTotals {
  casesCompleted: number;
  casesReturned: number;
  casesReturnedExternal: number;
  net: number;
}

/**
 * Aggregates raw case totals (not score) across a transaction set — always
 * completed minus DEPARTMENT_FAULT returns, regardless of a department's
 * scoringRule (which only affects the *score*, never the underlying
 * production numbers shown on the daily board). Reuses
 * summarizeAllEmployees/summarizeEmployeeScore — the same authoritative
 * per-employee calculation the leaderboard uses — so a correction dated
 * today is picked up automatically, exactly like everywhere else in the
 * app; nothing here recomputes scoring rules of its own.
 */
export function summarizeDailyProduction(
  transactions: ScoreTransactionInput[],
): DailyProductionTotals {
  const summaries = summarizeAllEmployees(transactions);
  let casesCompleted = 0;
  let casesReturned = 0;
  let casesReturnedExternal = 0;
  for (const s of summaries.values()) {
    casesCompleted += s.casesCompleted;
    casesReturned += s.casesReturned;
    casesReturnedExternal += s.casesReturnedExternal;
  }
  return { casesCompleted, casesReturned, casesReturnedExternal, net: casesCompleted - casesReturned };
}
