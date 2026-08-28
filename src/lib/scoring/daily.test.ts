import { describe, expect, it } from "vitest";
import { filterByDate, isSameUtcDay, summarizeDailyProduction } from "./daily";
import type { ScoreTransactionInput } from "./types";

function tx(overrides: Partial<ScoreTransactionInput>): ScoreTransactionInput {
  return {
    id: overrides.id ?? `tx-${Math.random()}`,
    type: "PRODUCTION_COMPLETED",
    employeeId: "emp-1",
    departmentId: "dept-1",
    cases: 1,
    points: null,
    responsibility: null,
    correctionTarget: null,
    eventDate: new Date("2026-08-27T00:00:00Z"),
    ...overrides,
  };
}

describe("isSameUtcDay / filterByDate — daily isolation", () => {
  it("matches transactions on the same UTC day", () => {
    expect(isSameUtcDay(new Date("2026-08-27T00:00:00Z"), new Date("2026-08-27T23:59:59Z"))).toBe(true);
  });

  it("does not match a neighboring day", () => {
    expect(isSameUtcDay(new Date("2026-08-26T23:59:59Z"), new Date("2026-08-27T00:00:00Z"))).toBe(false);
    expect(isSameUtcDay(new Date("2026-08-28T00:00:00Z"), new Date("2026-08-27T00:00:00Z"))).toBe(false);
  });

  it("today vs monthly: a date filter does not leak in other days from the same month", () => {
    const transactions = [
      tx({ eventDate: new Date("2026-08-26T00:00:00Z"), cases: 10 }),
      tx({ eventDate: new Date("2026-08-27T00:00:00Z"), cases: 20 }),
      tx({ eventDate: new Date("2026-08-28T00:00:00Z"), cases: 30 }),
    ];
    const today = filterByDate(transactions, new Date("2026-08-27T00:00:00Z"));
    expect(today).toHaveLength(1);
    expect(today[0].cases).toBe(20);
  });
});

describe("summarizeDailyProduction — daily aggregation is case-based", () => {
  it("aggregates completed cases across multiple employees (worked example: 8 + 6 + 9 = 23)", () => {
    const totals = summarizeDailyProduction([
      tx({ employeeId: "priya", cases: 8 }),
      tx({ employeeId: "ravi", cases: 6 }),
      tx({ employeeId: "neha", cases: 9 }),
    ]);
    expect(totals.casesCompleted).toBe(23);
    expect(totals.net).toBe(23);
  });

  it("employee-caused returned cases deduct from net (worked example: 23 completed, 3 returned -> 20)", () => {
    const totals = summarizeDailyProduction([
      tx({ employeeId: "priya", cases: 8 }),
      tx({ employeeId: "priya", type: "PRODUCTION_REWORK", cases: 1, responsibility: "DEPARTMENT_FAULT" }),
      tx({ employeeId: "ravi", cases: 6 }),
      tx({ employeeId: "neha", cases: 9 }),
      tx({ employeeId: "neha", type: "PRODUCTION_REWORK", cases: 2, responsibility: "DEPARTMENT_FAULT" }),
    ]);
    expect(totals.casesCompleted).toBe(23);
    expect(totals.casesReturned).toBe(3);
    expect(totals.net).toBe(20);
  });

  it("an externally-caused return does not deduct (0 impact), but is still tallied separately", () => {
    const totals = summarizeDailyProduction([
      tx({ employeeId: "a", cases: 10 }),
      tx({ employeeId: "a", type: "PRODUCTION_REWORK", cases: 4, responsibility: "EXTERNAL_NOT_FAULT" }),
    ]);
    expect(totals.casesReturnedExternal).toBe(4);
    expect(totals.casesReturned).toBe(0);
    expect(totals.net).toBe(10);
  });

  it("a same-day correction recalculates the daily total", () => {
    const totals = summarizeDailyProduction([
      tx({ id: "orig", employeeId: "a", cases: 25 }),
      tx({
        employeeId: "a",
        type: "CORRECTION",
        points: -10,
        correctionTarget: "COMPLETED_CASES",
      }),
    ]);
    expect(totals.casesCompleted).toBe(15);
    expect(totals.net).toBe(15);
  });

  it("returns all zeros for a day with no transactions", () => {
    expect(summarizeDailyProduction([])).toEqual({
      casesCompleted: 0,
      casesReturned: 0,
      casesReturnedExternal: 0,
      net: 0,
    });
  });

  it("combines multiple departments' transactions into one lab-wide total when given the full day", () => {
    const totals = summarizeDailyProduction([
      tx({ employeeId: "a", departmentId: "design", cases: 20 }),
      tx({ employeeId: "b", departmentId: "build-up", cases: 15 }),
    ]);
    expect(totals.casesCompleted).toBe(35);
  });

  it("a case's tooth count never affects the daily total — only the case count entered", () => {
    const totals = summarizeDailyProduction([
      tx({ employeeId: "a", cases: 1 }),
      tx({ employeeId: "b", cases: 1 }),
    ]);
    expect(totals.casesCompleted).toBe(2);
  });
});
