import { describe, expect, it } from "vitest";
import {
  deriveCorrectionTarget,
  validateCorrection,
  validateNewPointTransaction,
  type NewPointTransactionInput,
} from "./validation";

function base(overrides: Partial<NewPointTransactionInput>): NewPointTransactionInput {
  return {
    type: "MANUAL_BONUS",
    employeeId: "emp-1",
    departmentId: "dept-1",
    category: "HELPING_TEAMMATE",
    reason: "Helped another department with urgent work",
    eventDate: new Date("2026-06-01"),
    ...overrides,
  };
}

describe("validateNewPointTransaction", () => {
  it("rejects a point with no reason", () => {
    const result = validateNewPointTransaction(base({ reason: "" }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join(" ")).toMatch(/reason/i);
    }
  });

  it("rejects a whitespace-only reason", () => {
    const result = validateNewPointTransaction(base({ reason: "   " }));
    expect(result.valid).toBe(false);
  });

  it("rejects a missing category", () => {
    const result = validateNewPointTransaction(base({ category: "" }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join(" ")).toMatch(/category/i);
    }
  });

  it("rejects a category that isn't in the known list", () => {
    const result = validateNewPointTransaction(base({ category: "NOT_A_REAL_CATEGORY" }));
    expect(result.valid).toBe(false);
  });

  it("accepts a valid recognition", () => {
    expect(validateNewPointTransaction(base({})).valid).toBe(true);
  });

  it("accepts a valid deduction with a negative-side category", () => {
    expect(
      validateNewPointTransaction(
        base({ type: "MANUAL_DEDUCTION", category: "LATE_MARK", reason: "Arrived 40 minutes late" }),
      ).valid,
    ).toBe(true);
  });

  it("rejects a missing employeeId", () => {
    const result = validateNewPointTransaction(base({ employeeId: "" }));
    expect(result.valid).toBe(false);
  });
});

describe("deriveCorrectionTarget", () => {
  it("targets COMPLETED_CASES for a legacy completed-production original", () => {
    expect(
      deriveCorrectionTarget({ type: "PRODUCTION_COMPLETED", responsibility: null }),
    ).toBe("COMPLETED_CASES");
  });

  it("targets CASES_RETURNED for a legacy employee-caused return", () => {
    expect(
      deriveCorrectionTarget({ type: "PRODUCTION_REWORK", responsibility: "DEPARTMENT_FAULT" }),
    ).toBe("CASES_RETURNED");
  });

  it("targets CASES_RETURNED_EXTERNAL for a legacy external return", () => {
    expect(
      deriveCorrectionTarget({ type: "PRODUCTION_REWORK", responsibility: "EXTERNAL_NOT_FAULT" }),
    ).toBe("CASES_RETURNED_EXTERNAL");
  });

  it("targets MANUAL_BONUS / MANUAL_DEDUCTION for points", () => {
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

describe("validateCorrection — worked example: awarded 1 point by mistake, should have been 0", () => {
  const original = { type: "MANUAL_BONUS" as const, responsibility: null };

  it("computes the signed delta from the corrected value, not typed directly", () => {
    const result = validateCorrection(original, {
      originalType: "MANUAL_BONUS",
      originalAmount: 1,
      correctedValue: 0,
      reason: "Awarded to the wrong employee",
    });
    expect(result.valid).toBe(true);
    expect(result.delta).toBe(-1);
    expect(result.target).toBe("MANUAL_BONUS");
  });

  it("rejects a correction with no reason", () => {
    const result = validateCorrection(original, {
      originalType: "MANUAL_BONUS",
      originalAmount: 1,
      correctedValue: 0,
      reason: "",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a corrected value equal to the original (nothing to correct)", () => {
    const result = validateCorrection(original, {
      originalType: "MANUAL_BONUS",
      originalAmount: 1,
      correctedValue: 1,
      reason: "no change",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a negative corrected value", () => {
    const result = validateCorrection(original, {
      originalType: "MANUAL_BONUS",
      originalAmount: 1,
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
        originalAmount: -1,
        correctedValue: -0.5,
        reason: "chained correction",
      },
    );
    expect(result.valid).toBe(false);
  });
});
