// Plain data types for the scoring engine. Deliberately NOT imported from
// `@prisma/client` — the engine should be testable and reusable without a
// database, and this is the seam that keeps business logic decoupled from
// persistence (see README "Separate business logic from UI").
//
// POINTS: every point event is exactly +1 (a recognition) or -1 (a
// deduction), always with a category and a reason. There is no production,
// case-count, or workload concept in this system anymore.

export type TransactionType =
  // Legacy — see the schema comment on Department for why these remain.
  // No code creates new rows of these types; they're read-only history.
  | "PRODUCTION_COMPLETED"
  | "PRODUCTION_REWORK"
  | "MANUAL_BONUS"
  | "MANUAL_DEDUCTION"
  | "CORRECTION";

export type ReworkResponsibility = "DEPARTMENT_FAULT" | "EXTERNAL_NOT_FAULT";

/** Only meaningful for type CORRECTION — which counter the signed `points` delta adjusts. */
export type CorrectionTarget =
  | "COMPLETED_CASES"
  | "CASES_RETURNED"
  | "CASES_RETURNED_EXTERNAL"
  | "MANUAL_BONUS"
  | "MANUAL_DEDUCTION";

export interface ScoreTransactionInput {
  id: string;
  type: TransactionType;
  employeeId: string;
  departmentId: string;
  /** Legacy production case count — never read by the points engine. */
  cases: number | null;
  points: number | null;
  /** Legacy production field — never read by the points engine. */
  responsibility: ReworkResponsibility | null;
  correctionTarget: CorrectionTarget | null;
  eventDate: Date;
}

export interface EmployeePointsSummary {
  employeeId: string;
  /** Sum of all +1 recognitions (and any positive correction deltas). */
  positivePoints: number;
  /** Sum of all -1 deductions (and any negative correction deltas), stored as a positive magnitude. */
  negativePoints: number;
  /** positivePoints - negativePoints — the one number the whole app ranks and displays. */
  netPoints: number;
  /** Count of individual +1 recognition events (not counting corrections). */
  recognitionCount: number;
  /** Count of individual -1 deduction events (not counting corrections). */
  deductionCount: number;
}

export interface EmployeeLike {
  id: string;
  departmentId: string;
  isActive: boolean;
}
