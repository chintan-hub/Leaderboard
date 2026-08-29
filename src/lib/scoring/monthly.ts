import type { ScoreTransactionInput } from "./types";

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
