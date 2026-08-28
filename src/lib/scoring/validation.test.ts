import { describe, expect, it } from "vitest";
import {
  deriveCorrectionTarget,
  validateCorrection,
  validateNewTransaction,
  type NewTransactionInput,
} from "./validation";

function base(overrides: Partial<NewTransactionInput>): NewTransactionInput {
  return {
    type: "MANUAL_BONUS",
    employeeId: "emp-1",
    departmentId: "dept-1",
    points: 1,
    reason: "Helped another department with urgent work",
    eventDate: new Date("2026-06-01"),
    ...overrides,
  };
}

describe("validateNewTransaction", () => {
  it("rejects a manual point with no reason", () => {
    const result = validateNewTransaction(base({ reason: "" }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join(" ")).toMatch(/reason/i);
    }
  });

  it("rejects a whitespace-only reason", () => {
    const result = validateNewTransaction(base({ reason: "   " }));
    expect(result.valid).toBe(false);
  });

  it("accepts a valid manual bonus", () => {
    expect(validateNewTransaction(base({})).valid).toBe(true);
  });

  it("rejects completed production with zero or negative cases", () => {
    const result = validateNewTransaction(
      base({ type: "PRODUCTION_COMPLETED", cases: 0, reason: "x" }),
    );
    expect(result.valid).toBe(false);
  });

  it("rejects a returned case missing a responsibility classification", () => {
    const result = validateNewTransaction(
      base({ type: "PRODUCTION_REWORK", cases: 2, reason: "redo", responsibility: null }),
    );
    expect(result.valid).toBe(false);
  });

  it("accepts a returned case with a responsibility classification", () => {
    const result = validateNewTransaction(
      base({
        type: "PRODUCTION_REWORK",
        cases: 2,
        reason: "Margin issue",
        responsibility: "DEPARTMENT_FAULT",
      }),
    );
    expect(result.valid).toBe(true);
  });
});

describe("deriveCorrectionTarget", () => {
  it("targets COMPLETED_CASES for a completed-production original", () => {
    expect(
      deriveCorrectionTarget({ type: "PRODUCTION_COMPLETED", responsibility: null }),
    ).toBe("COMPLETED_CASES");
  });

  it("targets CASES_RETURNED for an employee-caused return", () => {
    expect(
      deriveCorrectionTarget({ type: "PRODUCTION_REWORK", responsibility: "DEPARTMENT_FAULT" }),
    ).toBe("CASES_RETURNED");
  });

  it("targets CASES_RETURNED_EXTERNAL for an external return", () => {
    expect(
      deriveCorrectionTarget({ type: "PRODUCTION_REWORK", responsibility: "EXTERNAL_NOT_FAULT" }),
    ).toBe("CASES_RETURNED_EXTERNAL");
  });

  it("targets MANUAL_BONUS / MANUAL_DEDUCTION for manual points", () => {
    expect(deriveCorrectionTarget({ type: "MANUAL_BONUS", responsibility: null })).toBe(
      "MANUAL_BONUS",
    );
    expect(deriveCorrectionTarget({ type: "MANUAL_DEDUCTION", responsibility: null })).toBe(
      "MANUAL_DEDUCTION",
    );
  });

  it("refuses to target a correction of a correction", () => {
    expect(deriveCorrectionTarget({ type: "CORRECTION", responsibility: null })).toBeNull();
  });
});

describe("validateCorrection — worked example: entered 25 cases instead of 15", () => {
  const original = { type: "PRODUCTION_COMPLETED" as const, responsibility: null };

  it("computes the signed delta from the corrected value, not typed directly", () => {
    const result = validateCorrection(original, {
      originalType: "PRODUCTION_COMPLETED",
      originalAmount: 25,
      correctedValue: 15,
      reason: "Entered 25 instead of 15",
    });
    expect(result.valid).toBe(true);
    expect(result.delta).toBe(-10);
    expect(result.target).toBe("COMPLETED_CASES");
  });

  it("rejects a correction with no reason", () => {
    const result = validateCorrection(original, {
      originalType: "PRODUCTION_COMPLETED",
      originalAmount: 25,
      correctedValue: 15,
      reason: "",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a corrected value equal to the original (nothing to correct)", () => {
    const result = validateCorrection(original, {
      originalType: "PRODUCTION_COMPLETED",
      originalAmount: 25,
      correctedValue: 25,
      reason: "no change",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a negative corrected value", () => {
    const result = validateCorrection(original, {
      originalType: "PRODUCTION_COMPLETED",
      originalAmount: 5,
      correctedValue: -1,
      reason: "oops",
    });
    expect(result.valid).toBe(false);
  });

  it("refuses to correct a correction", () => {
    const result = validateCorrection(
      { type: "CORRECTION", responsibility: null },
      {
        originalType: "CORRECTION",
        originalAmount: -10,
        correctedValue: -5,
        reason: "chained correction",
      },
    );
    expect(result.valid).toBe(false);
  });
});
