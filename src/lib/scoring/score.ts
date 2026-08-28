import type {
  EmployeeScoreSummary,
  ScoreTransactionInput,
  ScoringRule,
} from "./types";

/**
 * THE single authoritative scoring calculation. Every screen — Dashboard,
 * leaderboards, employee/department detail, Display Mode, both print
 * reports, Production Entry — derives its numbers from this function (or
 * from summarizeAllEmployees below, which just calls it per employee).
 * Nothing else in the app recomputes a score independently.
 *
 * SCORING UNIT: 1 case = 1 unit. A case is one job from one doctor; it does
 * not matter whether it contains 1 tooth or 32 — every completed or
 * returned case counts as exactly 1. Teeth are not tracked anywhere in
 * this ledger.
 *
 * Rules:
 *   - PRODUCTION_COMPLETED: +1 per case to casesCompleted and productionScore.
 *   - PRODUCTION_REWORK (a returned case) with responsibility
 *     DEPARTMENT_FAULT: -1 per case to productionScore (counted in casesReturned).
 *   - PRODUCTION_REWORK with responsibility EXTERNAL_NOT_FAULT (e.g. a
 *     doctor-requested change): recorded in casesReturnedExternal for
 *     transparency, but does NOT affect the score.
 *   - MANUAL_BONUS: +1 (or whatever `points` holds) to manualScore.
 *   - MANUAL_DEDUCTION: -1 (points is stored positive; subtracted here) to manualScore.
 *   - CORRECTION: applies its signed `points` delta directly to whichever
 *     counter `correctionTarget` names. The original transaction being
 *     corrected is untouched and still counted normally — the correction is
 *     simply an additional row that nets out against it, so the ledger sum
 *     always reflects reality without ever rewriting history.
 *
 * FINAL SCORE = CASES COMPLETED − CASES RETURNED + MANUAL POINTS.
 *
 * `scoringRule` (default "NET_PRODUCTION") lets a department opt out of
 * production scoring entirely via "MANUAL_POINTS_ONLY" — production is
 * still counted/shown for transparency, it just doesn't count toward the
 * score for that department's employees. This is a per-department on/off
 * switch, not a different formula — every department that does score
 * production uses the exact same case-based math.
 */
export function summarizeEmployeeScore(
  employeeId: string,
  transactions: ScoreTransactionInput[],
  scoringRule: ScoringRule = "NET_PRODUCTION",
): EmployeeScoreSummary {
  let casesCompleted = 0;
  let casesReturned = 0;
  let casesReturnedExternal = 0;
  let manualBonusPoints = 0;
  let manualDeductionPoints = 0;

  for (const tx of transactions) {
    if (tx.employeeId !== employeeId) continue;

    switch (tx.type) {
      case "PRODUCTION_COMPLETED": {
        casesCompleted += tx.cases ?? 0;
        break;
      }
      case "PRODUCTION_REWORK": {
        const cases = tx.cases ?? 0;
        if (tx.responsibility === "DEPARTMENT_FAULT") {
          casesReturned += cases;
        } else {
          casesReturnedExternal += cases;
        }
        break;
      }
      case "MANUAL_BONUS": {
        manualBonusPoints += Math.abs(tx.points ?? 0);
        break;
      }
      case "MANUAL_DEDUCTION": {
        manualDeductionPoints += Math.abs(tx.points ?? 0);
        break;
      }
      case "CORRECTION": {
        const delta = tx.points ?? 0;
        switch (tx.correctionTarget) {
          case "COMPLETED_CASES":
            casesCompleted += delta;
            break;
          case "CASES_RETURNED":
            casesReturned += delta;
            break;
          case "CASES_RETURNED_EXTERNAL":
            casesReturnedExternal += delta;
            break;
          case "MANUAL_BONUS":
            manualBonusPoints += delta;
            break;
          case "MANUAL_DEDUCTION":
            manualDeductionPoints += delta;
            break;
        }
        break;
      }
    }
  }

  const rawProductionScore = casesCompleted - casesReturned;
  const productionScore = scoringRule === "MANUAL_POINTS_ONLY" ? 0 : rawProductionScore;
  const manualScore = manualBonusPoints - manualDeductionPoints;
  const finalScore = productionScore + manualScore;

  return {
    employeeId,
    casesCompleted,
    casesReturned,
    casesReturnedExternal,
    productionScore,
    manualBonusPoints,
    manualDeductionPoints,
    manualScore,
    finalScore,
  };
}

/**
 * Convenience for grouping a mixed transaction list by employee before
 * summarizing. `scoringRuleByEmployee` optionally maps employeeId -> that
 * employee's department's scoring rule; employees not in the map default to
 * NET_PRODUCTION.
 */
export function summarizeAllEmployees(
  transactions: ScoreTransactionInput[],
  scoringRuleByEmployee?: Map<string, ScoringRule>,
): Map<string, EmployeeScoreSummary> {
  const employeeIds = new Set(transactions.map((tx) => tx.employeeId));
  const result = new Map<string, EmployeeScoreSummary>();
  for (const employeeId of employeeIds) {
    const rule = scoringRuleByEmployee?.get(employeeId) ?? "NET_PRODUCTION";
    result.set(employeeId, summarizeEmployeeScore(employeeId, transactions, rule));
  }
  return result;
}
