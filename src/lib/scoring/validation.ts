import { isValidCategory } from "./point-categories";
import type { CorrectionTarget, ReworkResponsibility, TransactionType } from "./types";

export interface NewPointTransactionInput {
  type: "MANUAL_BONUS" | "MANUAL_DEDUCTION";
  employeeId: string;
  departmentId: string;
  category: string;
  reason: string;
  eventDate: Date;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

/**
 * Guards every new point-changing write. This is the one place that
 * enforces "no unexplained point changes" — a valid category and a
 * non-empty reason are both mandatory for every point, positive or negative.
 */
export function validateNewPointTransaction(
  input: NewPointTransactionInput,
): ValidationResult {
  const errors: string[] = [];

  if (!input.employeeId) errors.push("Select an employee.");
  if (!input.departmentId) errors.push("Could not resolve that employee's department.");
  if (!input.eventDate || Number.isNaN(input.eventDate.getTime())) {
    errors.push("A valid date is required.");
  }
  if (!input.category || !isValidCategory(input.category)) {
    errors.push("Select a category.");
  }
  if (!input.reason || input.reason.trim().length === 0) {
    errors.push("A reason is required for every point.");
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Derives which counter a correction adjusts from the transaction being
 * corrected. This is never a choice the admin makes in the UI — it's
 * mechanical, so a correction can't accidentally land on the wrong bucket.
 * Still generic across legacy production types too, so an old
 * PRODUCTION_COMPLETED/PRODUCTION_REWORK row can still be corrected for
 * record accuracy even though production no longer affects anyone's points.
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
  /** The original row's own contribution to its bucket (case count for legacy production types, 1 for point types). */
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
