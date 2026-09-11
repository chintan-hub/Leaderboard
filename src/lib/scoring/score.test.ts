import { describe, expect, it } from "vitest";
import { summarizeAllEmployees, summarizeEmployeePoints } from "./score";
import type { ScoreTransactionInput } from "./types";

const DEPT = "dept-design";
const EMP = "emp-1";

function tx(overrides: Partial<ScoreTransactionInput>): ScoreTransactionInput {
  return {
    id: overrides.id ?? `tx-${Math.random()}`,
    type: "MANUAL_BONUS",
    employeeId: EMP,
    departmentId: DEPT,
    cases: null,
    points: 1,
    responsibility: null,
    correctionTarget: null,
    eventDate: new Date("2026-06-15T00:00:00Z"),
    ...overrides,
  };
}

describe("summarizeEmployeePoints — every point is +1 or -1", () => {
  it("a recognition is +1 positive point and +1 net", () => {
    const summary = summarizeEmployeePoints(EMP, [tx({ type: "MANUAL_BONUS" })]);
    expect(summary.positivePoints).toBe(1);
    expect(summary.negativePoints).toBe(0);
    expect(summary.netPoints).toBe(1);
    expect(summary.recognitionCount).toBe(1);
  });

  it("a deduction is -1 net, tracked as a positive magnitude in negativePoints", () => {
    const summary = summarizeEmployeePoints(EMP, [tx({ type: "MANUAL_DEDUCTION" })]);
    expect(summary.negativePoints).toBe(1);
    expect(summary.positivePoints).toBe(0);
    expect(summary.netPoints).toBe(-1);
    expect(summary.deductionCount).toBe(1);
  });

  it("worked example: 3 recognitions and 1 deduction nets to +2", () => {
    const summary = summarizeEmployeePoints(EMP, [
      tx({ type: "MANUAL_BONUS" }),
      tx({ type: "MANUAL_BONUS" }),
      tx({ type: "MANUAL_BONUS" }),
      tx({ type: "MANUAL_DEDUCTION" }),
    ]);
    expect(summary.positivePoints).toBe(3);
    expect(summary.negativePoints).toBe(1);
    expect(summary.netPoints).toBe(2);
    expect(summary.recognitionCount).toBe(3);
    expect(summary.deductionCount).toBe(1);
  });

  it("ignores transactions belonging to a different employee", () => {
    const summary = summarizeEmployeePoints(EMP, [
      tx({ type: "MANUAL_BONUS" }),
      tx({ employeeId: "someone-else", type: "MANUAL_BONUS" }),
    ]);
    expect(summary.positivePoints).toBe(1);
  });

  it("ignores legacy PRODUCTION_COMPLETED / PRODUCTION_REWORK rows entirely — they no longer contribute to points", () => {
    const summary = summarizeEmployeePoints(EMP, [
      tx({ type: "PRODUCTION_COMPLETED", cases: 50, points: null }),
      tx({ type: "PRODUCTION_REWORK", cases: 10, points: null, responsibility: "DEPARTMENT_FAULT" }),
      tx({ type: "MANUAL_BONUS" }),
    ]);
    expect(summary.positivePoints).toBe(1);
    expect(summary.negativePoints).toBe(0);
    expect(summary.netPoints).toBe(1);
  });

  it("returns a zeroed summary for an employee with no transactions", () => {
    const summary = summarizeEmployeePoints(EMP, []);
    expect(summary).toMatchObject({
      positivePoints: 0,
      negativePoints: 0,
      netPoints: 0,
      recognitionCount: 0,
      deductionCount: 0,
    });
  });
});

describe("summarizeEmployeePoints — corrections", () => {
  it("a correction can reduce a recognition's contribution without touching the original transaction", () => {
    const summary = summarizeEmployeePoints(EMP, [
      tx({ id: "orig", type: "MANUAL_BONUS" }),
      tx({ type: "CORRECTION", points: -1, correctionTarget: "MANUAL_BONUS" }),
    ]);
    expect(summary.positivePoints).toBe(0);
    expect(summary.netPoints).toBe(0);
  });

  it("a correction can increase a deduction's contribution", () => {
    const summary = summarizeEmployeePoints(EMP, [
      tx({ type: "MANUAL_DEDUCTION" }),
      tx({ type: "CORRECTION", points: 1, correctionTarget: "MANUAL_DEDUCTION" }),
    ]);
    expect(summary.negativePoints).toBe(2);
    expect(summary.netPoints).toBe(-2);
  });

  it("a correction targeting a legacy production bucket has no effect on points", () => {
    const summary = summarizeEmployeePoints(EMP, [
      tx({ type: "MANUAL_BONUS" }),
      tx({ type: "CORRECTION", points: -10, correctionTarget: "COMPLETED_CASES" }),
    ]);
    expect(summary.netPoints).toBe(1);
  });
});

describe("summarizeAllEmployees", () => {
  it("groups a mixed ledger by employee independently (worked example: Priya +2, Ravi +1, Neha -1)", () => {
    const transactions = [
      tx({ employeeId: "priya", type: "MANUAL_BONUS" }),
      tx({ employeeId: "priya", type: "MANUAL_BONUS" }),
      tx({ employeeId: "ravi", type: "MANUAL_BONUS" }),
      tx({ employeeId: "neha", type: "MANUAL_DEDUCTION" }),
    ];
    const result = summarizeAllEmployees(transactions);
    expect(result.get("priya")?.netPoints).toBe(2);
    expect(result.get("ravi")?.netPoints).toBe(1);
    expect(result.get("neha")?.netPoints).toBe(-1);
  });
});
