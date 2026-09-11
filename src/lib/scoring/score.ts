import type { EmployeePointsSummary, ScoreTransactionInput } from "./types";

/**
 * THE single authoritative points calculation. Every screen — Dashboard,
 * leaderboards, employee/department detail, Display Mode, print, exports —
 * derives its numbers from this function (or from summarizeAllEmployees
 * below, which just calls it per employee). Nothing else in the app
 * recomputes points independently.
 *
 * Every point event is exactly +1 (MANUAL_BONUS, a recognition) or -1
 * (MANUAL_DEDUCTION, a deduction). A CORRECTION applies its signed `points`
 * delta to whichever bucket its `correctionTarget` names — the original
 * transaction being corrected is untouched and still counted normally, so
 * the ledger sum always reflects reality without ever rewriting history.
 *
 * Legacy PRODUCTION_COMPLETED / PRODUCTION_REWORK rows (from the old
 * production-scoring system) and any correction targeting them are
 * intentionally ignored here — they no longer participate in anyone's
 * points, though they remain visible in Activity History as historical
 * record.
 *
 * NET POINTS = POSITIVE POINTS − NEGATIVE POINTS. This is the only score in
 * the app.
 */
export function summarizeEmployeePoints(
  employeeId: string,
  transactions: ScoreTransactionInput[],
): EmployeePointsSummary {
  let positivePoints = 0;
  let negativePoints = 0;
  let recognitionCount = 0;
  let deductionCount = 0;

  for (const tx of transactions) {
    if (tx.employeeId !== employeeId) continue;

    switch (tx.type) {
      case "MANUAL_BONUS": {
        positivePoints += Math.abs(tx.points ?? 0);
        recognitionCount += 1;
        break;
      }
      case "MANUAL_DEDUCTION": {
        negativePoints += Math.abs(tx.points ?? 0);
        deductionCount += 1;
        break;
      }
      case "CORRECTION": {
        const delta = tx.points ?? 0;
        if (tx.correctionTarget === "MANUAL_BONUS") {
          positivePoints += delta;
        } else if (tx.correctionTarget === "MANUAL_DEDUCTION") {
          negativePoints += delta;
        }
        // Corrections targeting legacy production buckets are ignored.
        break;
      }
      // PRODUCTION_COMPLETED / PRODUCTION_REWORK: legacy, not points.
    }
  }

  return {
    employeeId,
    positivePoints,
    negativePoints,
    netPoints: positivePoints - negativePoints,
    recognitionCount,
    deductionCount,
  };
}

/** Convenience for grouping a mixed transaction list by employee before summarizing. */
export function summarizeAllEmployees(
  transactions: ScoreTransactionInput[],
): Map<string, EmployeePointsSummary> {
  const employeeIds = new Set(transactions.map((tx) => tx.employeeId));
  const result = new Map<string, EmployeePointsSummary>();
  for (const employeeId of employeeIds) {
    result.set(employeeId, summarizeEmployeePoints(employeeId, transactions));
  }
  return result;
}
