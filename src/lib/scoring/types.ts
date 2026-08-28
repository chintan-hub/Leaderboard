// Plain data types for the scoring engine. Deliberately NOT imported from
// `@prisma/client` — the engine should be testable and reusable without a
// database, and this is the seam that keeps business logic decoupled from
// persistence (see README "Separate business logic from UI").
//
// SCORING UNIT: 1 case = 1 unit. A case is one job from one doctor,
// regardless of how many teeth it contains — a 32-tooth case and a
// 1-tooth case both count as exactly 1. Teeth are never counted anywhere
// in this engine.

export type TransactionType =
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

/** Scoring rule keys resolved in score.ts. Kept as a plain string on Department so new rules can be added without a migration. */
export type ScoringRule = "NET_PRODUCTION" | "MANUAL_POINTS_ONLY";

export interface ScoreTransactionInput {
  id: string;
  type: TransactionType;
  employeeId: string;
  departmentId: string;
  /** Case count for PRODUCTION_* rows — never a tooth count. */
  cases: number | null;
  points: number | null;
  responsibility: ReworkResponsibility | null;
  correctionTarget: CorrectionTarget | null;
  eventDate: Date;
}

export interface EmployeeScoreSummary {
  employeeId: string;
  casesCompleted: number;
  /** Returned cases that counted against the employee (responsibility = DEPARTMENT_FAULT). */
  casesReturned: number;
  /** Returned cases logged but excluded from scoring (responsibility = EXTERNAL_NOT_FAULT). */
  casesReturnedExternal: number;
  productionScore: number;
  manualBonusPoints: number;
  manualDeductionPoints: number;
  manualScore: number;
  finalScore: number;
}

export interface DepartmentLike {
  id: string;
  scoringRule: string;
  rankingMetric: string;
}

export interface EmployeeLike {
  id: string;
  departmentId: string;
  isActive: boolean;
}
