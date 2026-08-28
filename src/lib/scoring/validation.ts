import type { CorrectionTarget, ReworkResponsibility, TransactionType } from "./types";

export interface NewTransactionInput {
  type: TransactionType;
  employeeId: string;
  departmentId: string;
  cases?: number | null;
  points?: number | null;
  responsibility?: ReworkResponsibility | null;
  reason: string;
  eventDate: Date;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

/**
 * Guards every score-changing write. This is the one place that enforces
 * "no unexplained score changes" — a non-empty reason is mandatory for
 * every transaction type, production or manual alike.
 */
export function validateNewTransaction(
  input: NewTransactionInput,
): ValidationResult {
  const errors: string[] = [];

  if (!input.reason || input.reason.trim().length === 0) {
    errors.push("A reason is required for every score-changing entry.");
  }

  if (!input.employeeId) errors.push("employeeId is required.");
  if (!input.departmentId) errors.push("departmentId is required.");
  if (!input.eventDate || Number.isNaN(input.eventDate.getTime())) {
    errors.push("A valid eventDate is required.");
  }

  switch (input.type) {
    case "PRODUCTION_COMPLETED": {
      if (!Number.isInteger(input.cases) || (input.cases as number) <= 0) {
        errors.push("cases must be a positive integer for completed production.");
      }
      break;
    }
    case "PRODUCTION_REWORK": {
      if (!Number.isInteger(input.cases) || (input.cases as number) <= 0) {
        errors.push("cases must be a positive integer for a returned case.");
      }
      if (
        input.responsibility !== "DEPARTMENT_FAULT" &&
        input.responsibility !== "EXTERNAL_NOT_FAULT"
      ) {
        errors.push(
          "responsibility must be DEPARTMENT_FAULT or EXTERNAL_NOT_FAULT for a returned case.",
        );
      }
      break;
    }
    case "MANUAL_BONUS":
    case "MANUAL_DEDUCTION": {
      if (input.points !== 1) {
        errors.push("Manual points must be exactly 1 (recorded as bonus or deduction).");
      }
      break;
    }
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Derives which counter a correction adjusts from the transaction being
 * corrected. This is never a choice the admin makes in the UI — it's
 * mechanical, so a "completed cases" correction can't accidentally land on
 * "manual bonus" or vice versa.
 */
export function deriveCorrectionTarget(original: {
  type: TransactionType;
  responsibility: ReworkResponsibility | null;
}): CorrectionTarget | null {
  switch (original.type) {
    case "PRODUCTION_COMPLETED":
      return "COMPLETED_CASES";
    case "PRODUCTION_REWORK":
      return original.responsibility === "DEPARTMENT_FAULT"
        ? "CASES_RETURNED"
        : "CASES_RETURNED_EXTERNAL";
    case "MANUAL_BONUS":
      return "MANUAL_BONUS";
    case "MANUAL_DEDUCTION":
      return "MANUAL_DEDUCTION";
    case "CORRECTION":
      return null; // corrections cannot themselves be corrected
  }
}

export interface CorrectionInput {
  originalType: TransactionType;
  /** The original row's own contribution to its bucket (case count for production types, 1 for manual types). */
  originalAmount: number;
  correctedValue: number;
  reason: string;
}

export interface CorrectionValidationResult {
  valid: boolean;
  errors: string[];
  delta: number;
  target: CorrectionTarget | null;
}

/**
 * Validates a proposed correction. The admin enters the value the entry
 * SHOULD have been (`correctedValue`); the signed delta applied to the
 * ledger is computed from that, not typed directly — much harder to get
 * wrong than asking someone to mentally compute "-10".
 */
export function validateCorrection(
  original: { type: TransactionType; responsibility: ReworkResponsibility | null },
  input: CorrectionInput,
): CorrectionValidationResult {
  const errors: string[] = [];
  const target = deriveCorrectionTarget(original);

  if (!target) {
    errors.push("This transaction cannot be corrected.");
  }
  if (!input.reason || input.reason.trim().length === 0) {
    errors.push("A reason is required to explain the correction.");
  }
  if (!Number.isInteger(input.correctedValue) || input.correctedValue < 0) {
    errors.push("The corrected value must be a non-negative whole number.");
  }

  const delta = input.correctedValue - input.originalAmount;
  if (Number.isInteger(input.correctedValue) && delta === 0) {
    errors.push("The corrected value is the same as the original — nothing to correct.");
  }

  return { valid: errors.length === 0, errors, delta, target };
}
