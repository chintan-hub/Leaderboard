import type { ReworkResponsibility } from "./types";

export interface BulkProductionRow {
  employeeId: string;
  /** Cases completed by this employee on this date. 0 (or omitted) means "nothing to record". */
  completed: number;
  /** Cases returned to this employee on this date. 0 (or omitted) means "nothing to record". */
  rework: number;
  reworkResponsibility?: ReworkResponsibility | null;
  reworkReason?: string | null;
}

export interface BulkProductionInput {
  departmentId: string;
  eventDate: Date;
  /** Default reason stamped on every completed-case row — daily production doesn't need a per-employee explanation. */
  completedReason: string;
  reworkTrackingEnabled: boolean;
  rows: BulkProductionRow[];
}

export interface PreparedProductionTransaction {
  type: "PRODUCTION_COMPLETED" | "PRODUCTION_REWORK";
  employeeId: string;
  departmentId: string;
  cases: number;
  reason: string;
  responsibility: ReworkResponsibility | null;
  eventDate: Date;
}

export type BulkProductionResult =
  | { ok: true; transactions: PreparedProductionTransaction[] }
  | { ok: false; errors: string[] };

/**
 * Pure transformation from a day's bulk-entry grid into the individual
 * ledger rows it should create — no database access, so the "one Save
 * creates the right transactions exactly once, for every employee entered"
 * guarantee is fully unit-testable.
 *
 * A row with completed=0 and rework=0 is skipped entirely (empty means 0,
 * not "record a zero"). A returned-case count > 0 requires a responsibility
 * and reason, unless the department has return tracking turned off, in
 * which case any nonzero value is rejected outright.
 */
export function buildBulkProductionTransactions(
  input: BulkProductionInput,
): BulkProductionResult {
  const errors: string[] = [];
  const transactions: PreparedProductionTransaction[] = [];
  const seenEmployeeIds = new Set<string>();

  if (Number.isNaN(input.eventDate.getTime())) {
    errors.push("A valid date is required.");
  }
  if (input.rows.length === 0) {
    errors.push("No employees to save.");
  }

  for (const row of input.rows) {
    if (!row.employeeId) {
      errors.push("Every row must have an employee.");
      continue;
    }
    if (seenEmployeeIds.has(row.employeeId)) {
      errors.push(`Employee ${row.employeeId} appears more than once in this submission.`);
      continue;
    }
    seenEmployeeIds.add(row.employeeId);

    const completed = row.completed || 0;
    const rework = row.rework || 0;

    if (!Number.isInteger(completed) || completed < 0) {
      errors.push(`Cases completed must be a non-negative whole number for ${row.employeeId}.`);
      continue;
    }
    if (!Number.isInteger(rework) || rework < 0) {
      errors.push(`Cases returned must be a non-negative whole number for ${row.employeeId}.`);
      continue;
    }
    if (rework > 0 && !input.reworkTrackingEnabled) {
      errors.push(`Returned-case tracking is disabled for this department (employee ${row.employeeId}).`);
      continue;
    }

    if (completed === 0 && rework === 0) {
      continue; // nothing to record for this employee
    }

    if (completed > 0) {
      transactions.push({
        type: "PRODUCTION_COMPLETED",
        employeeId: row.employeeId,
        departmentId: input.departmentId,
        cases: completed,
        reason: input.completedReason,
        responsibility: null,
        eventDate: input.eventDate,
      });
    }

    if (rework > 0) {
      if (
        row.reworkResponsibility !== "DEPARTMENT_FAULT" &&
        row.reworkResponsibility !== "EXTERNAL_NOT_FAULT"
      ) {
        errors.push(`Select whether the return for ${row.employeeId} was employee-caused or external.`);
        continue;
      }
      if (!row.reworkReason || row.reworkReason.trim().length === 0) {
        errors.push(`A reason is required for the return for ${row.employeeId}.`);
        continue;
      }
      transactions.push({
        type: "PRODUCTION_REWORK",
        employeeId: row.employeeId,
        departmentId: input.departmentId,
        cases: rework,
        reason: row.reworkReason,
        responsibility: row.reworkResponsibility,
        eventDate: input.eventDate,
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  if (transactions.length === 0) {
    return { ok: false, errors: ["Enter at least one completed or returned case before saving."] };
  }

  return { ok: true, transactions };
}
