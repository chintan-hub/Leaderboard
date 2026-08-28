import { describe, expect, it } from "vitest";
import { summarizeAllEmployees, summarizeEmployeeScore } from "./score";
import type { ScoreTransactionInput } from "./types";

const DEPT = "dept-design";
const EMP = "emp-1";

function tx(overrides: Partial<ScoreTransactionInput>): ScoreTransactionInput {
  return {
    id: overrides.id ?? `tx-${Math.random()}`,
    type: "PRODUCTION_COMPLETED",
    employeeId: EMP,
    departmentId: DEPT,
    cases: null,
    points: null,
    responsibility: null,
    correctionTarget: null,
    eventDate: new Date("2026-06-15T00:00:00Z"),
    ...overrides,
  };
}

describe("summarizeEmployeeScore — 1 case = 1 unit", () => {
  it("1 completed case = +1 production score, regardless of how many teeth it contains", () => {
    const summary = summarizeEmployeeScore(EMP, [
      tx({ type: "PRODUCTION_COMPLETED", cases: 1 }),
    ]);
    expect(summary.casesCompleted).toBe(1);
    expect(summary.productionScore).toBe(1);
    expect(summary.finalScore).toBe(1);
  });

  it("a 32-tooth case contributes exactly +1, not +32 — the ledger only ever records a case count, never a tooth count", () => {
    // The schema has no tooth field at all: recording "1 case" for a job
    // that happens to contain 32 teeth is indistinguishable from recording
    // "1 case" for a single-tooth job. This test documents that guarantee.
    const summary = summarizeEmployeeScore(EMP, [
      tx({ type: "PRODUCTION_COMPLETED", cases: 1 }),
    ]);
    expect(summary.casesCompleted).toBe(1);
    expect(summary.productionScore).toBe(1);
  });

  it("10 one-tooth cases entered as 10 separate completions score 10, same as 10 entered in one row", () => {
    const tenSeparateRows = summarizeEmployeeScore(
      EMP,
      Array.from({ length: 10 }, () => tx({ type: "PRODUCTION_COMPLETED", cases: 1 })),
    );
    const oneRowOfTen = summarizeEmployeeScore(EMP, [tx({ type: "PRODUCTION_COMPLETED", cases: 10 })]);
    expect(tenSeparateRows.casesCompleted).toBe(10);
    expect(tenSeparateRows.productionScore).toBe(10);
    expect(oneRowOfTen.casesCompleted).toBe(10);
    expect(oneRowOfTen.productionScore).toBe(10);
  });

  it("1 employee-caused returned case = -1 production score", () => {
    const summary = summarizeEmployeeScore(EMP, [
      tx({ type: "PRODUCTION_COMPLETED", cases: 1 }),
      tx({
        type: "PRODUCTION_REWORK",
        cases: 1,
        responsibility: "DEPARTMENT_FAULT",
      }),
    ]);
    expect(summary.casesReturned).toBe(1);
    expect(summary.productionScore).toBe(0);
  });

  it("multiple returned cases each deduct one point (worked example: 8 completed, 1 returned -> 7)", () => {
    const summary = summarizeEmployeeScore(EMP, [
      tx({ type: "PRODUCTION_COMPLETED", cases: 8 }),
      tx({
        type: "PRODUCTION_REWORK",
        cases: 1,
        responsibility: "DEPARTMENT_FAULT",
      }),
    ]);
    expect(summary.casesCompleted).toBe(8);
    expect(summary.casesReturned).toBe(1);
    expect(summary.productionScore).toBe(7);
    expect(summary.finalScore).toBe(7);
  });

  it("a case returned for a reason outside the employee's responsibility (e.g. doctor-requested change) does NOT deduct", () => {
    const summary = summarizeEmployeeScore(EMP, [
      tx({ type: "PRODUCTION_COMPLETED", cases: 8 }),
      tx({
        type: "PRODUCTION_REWORK",
        cases: 2,
        responsibility: "EXTERNAL_NOT_FAULT",
      }),
    ]);
    // Still logged for transparency...
    expect(summary.casesReturnedExternal).toBe(2);
    // ...but does not touch the score.
    expect(summary.casesReturned).toBe(0);
    expect(summary.productionScore).toBe(8);
  });

  it("manual +1/-1 points are tracked separately from production score (worked example: 8 completed, 1 returned, +2 manual -> 9)", () => {
    const summary = summarizeEmployeeScore(EMP, [
      tx({ type: "PRODUCTION_COMPLETED", cases: 8 }),
      tx({
        type: "PRODUCTION_REWORK",
        cases: 1,
        responsibility: "DEPARTMENT_FAULT",
      }),
      tx({ type: "MANUAL_BONUS", points: 1 }),
      tx({ type: "MANUAL_BONUS", points: 1 }),
    ]);
    expect(summary.productionScore).toBe(7); // 8 - 1, untouched by manual points
    expect(summary.manualBonusPoints).toBe(2);
    expect(summary.manualScore).toBe(2);
    expect(summary.finalScore).toBe(9); // completed - returned + manual, never hidden
  });

  it("final score = cases completed − cases returned + manual points", () => {
    const summary = summarizeEmployeeScore(EMP, [
      tx({ type: "PRODUCTION_COMPLETED", cases: 20 }),
      tx({ type: "PRODUCTION_REWORK", cases: 2, responsibility: "DEPARTMENT_FAULT" }),
      tx({ type: "MANUAL_BONUS", points: 1 }),
      tx({ type: "MANUAL_DEDUCTION", points: 1 }),
    ]);
    expect(summary.finalScore).toBe(
      summary.casesCompleted - summary.casesReturned + summary.manualScore,
    );
    expect(summary.finalScore).toBe(18); // 20 - 2 + (1 - 1)
  });

  it("ignores transactions belonging to a different employee", () => {
    const summary = summarizeEmployeeScore(EMP, [
      tx({ type: "PRODUCTION_COMPLETED", cases: 5 }),
      tx({ employeeId: "someone-else", type: "PRODUCTION_COMPLETED", cases: 99 }),
    ]);
    expect(summary.casesCompleted).toBe(5);
  });

  it("returns zeroed summary for an employee with no transactions", () => {
    const summary = summarizeEmployeeScore(EMP, []);
    expect(summary).toMatchObject({
      casesCompleted: 0,
      casesReturned: 0,
      casesReturnedExternal: 0,
      productionScore: 0,
      manualBonusPoints: 0,
      manualDeductionPoints: 0,
      manualScore: 0,
      finalScore: 0,
    });
  });
});

describe("summarizeEmployeeScore — corrections recalculate the case-based score", () => {
  it("a correction reduces completed cases without touching the original transaction (25 -> 15)", () => {
    const summary = summarizeEmployeeScore(EMP, [
      tx({ id: "orig", type: "PRODUCTION_COMPLETED", cases: 25 }),
      tx({
        type: "CORRECTION",
        points: -10,
        correctionTarget: "COMPLETED_CASES",
      }),
    ]);
    // The original row's own value is untouched...
    expect(summary.casesCompleted).toBe(15); // ...but the aggregate reflects the correction
    expect(summary.productionScore).toBe(15);
    expect(summary.finalScore).toBe(15);
  });

  it("a correction can adjust cases returned", () => {
    const summary = summarizeEmployeeScore(EMP, [
      tx({ type: "PRODUCTION_COMPLETED", cases: 20 }),
      tx({ type: "PRODUCTION_REWORK", cases: 5, responsibility: "DEPARTMENT_FAULT" }),
      tx({ type: "CORRECTION", points: -2, correctionTarget: "CASES_RETURNED" }),
    ]);
    expect(summary.casesReturned).toBe(3); // 5 - 2
    expect(summary.productionScore).toBe(17); // 20 - 3
  });

  it("a correction can adjust manual points independently of production", () => {
    const summary = summarizeEmployeeScore(EMP, [
      tx({ type: "MANUAL_BONUS", points: 1 }),
      tx({ type: "CORRECTION", points: -1, correctionTarget: "MANUAL_BONUS" }),
    ]);
    expect(summary.manualBonusPoints).toBe(0);
    expect(summary.manualScore).toBe(0);
  });

  it("a correction can increase a value, not just decrease it", () => {
    const summary = summarizeEmployeeScore(EMP, [
      tx({ type: "PRODUCTION_COMPLETED", cases: 10 }),
      tx({ type: "CORRECTION", points: 5, correctionTarget: "COMPLETED_CASES" }),
    ]);
    expect(summary.casesCompleted).toBe(15);
  });
});

describe("summarizeEmployeeScore — scoring rules", () => {
  it("NET_PRODUCTION (default) counts completed minus returned cases toward the score", () => {
    const summary = summarizeEmployeeScore(
      EMP,
      [tx({ type: "PRODUCTION_COMPLETED", cases: 10 })],
      "NET_PRODUCTION",
    );
    expect(summary.productionScore).toBe(10);
  });

  it("MANUAL_POINTS_ONLY forces production score to 0 but still reports raw case counts", () => {
    const summary = summarizeEmployeeScore(
      EMP,
      [
        tx({ type: "PRODUCTION_COMPLETED", cases: 10 }),
        tx({ type: "MANUAL_BONUS", points: 1 }),
      ],
      "MANUAL_POINTS_ONLY",
    );
    expect(summary.casesCompleted).toBe(10); // still shown for transparency
    expect(summary.productionScore).toBe(0); // but doesn't count toward the score
    expect(summary.manualScore).toBe(1);
    expect(summary.finalScore).toBe(1); // manual score only
  });
});

describe("summarizeAllEmployees", () => {
  it("groups a mixed ledger by employee independently (worked example: Priya 8/1, Ravi 6/0, Neha 9/2)", () => {
    const transactions = [
      tx({ employeeId: "priya", type: "PRODUCTION_COMPLETED", cases: 8 }),
      tx({ employeeId: "priya", type: "PRODUCTION_REWORK", cases: 1, responsibility: "DEPARTMENT_FAULT" }),
      tx({ employeeId: "ravi", type: "PRODUCTION_COMPLETED", cases: 6 }),
      tx({ employeeId: "neha", type: "PRODUCTION_COMPLETED", cases: 9 }),
      tx({ employeeId: "neha", type: "PRODUCTION_REWORK", cases: 2, responsibility: "DEPARTMENT_FAULT" }),
    ];
    const result = summarizeAllEmployees(transactions);
    expect(result.get("priya")?.finalScore).toBe(7);
    expect(result.get("ravi")?.finalScore).toBe(6);
    expect(result.get("neha")?.finalScore).toBe(7);
  });

  it("applies a per-employee scoring rule map", () => {
    const transactions = [
      tx({ employeeId: "a", type: "PRODUCTION_COMPLETED", cases: 10 }),
      tx({ employeeId: "b", type: "PRODUCTION_COMPLETED", cases: 10 }),
    ];
    const result = summarizeAllEmployees(
      transactions,
      new Map([["a", "MANUAL_POINTS_ONLY"]]),
    );
    expect(result.get("a")?.productionScore).toBe(0);
    expect(result.get("b")?.productionScore).toBe(10); // defaults to NET_PRODUCTION when not in the map
  });
});
