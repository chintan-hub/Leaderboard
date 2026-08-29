import { describe, expect, it } from "vitest";
import { filterByMonth, isInMonth } from "./monthly";
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
    eventDate: new Date("2026-06-15T00:00:00Z"),
    ...overrides,
  };
}

describe("isInMonth / filterByMonth — monthly isolation", () => {
  it("matches a date inside the target month", () => {
    expect(isInMonth(new Date("2026-06-01T00:00:00Z"), 2026, 6)).toBe(true);
    expect(isInMonth(new Date("2026-06-30T23:59:59Z"), 2026, 6)).toBe(true);
  });

  it("does not match a date in a neighboring month", () => {
    expect(isInMonth(new Date("2026-05-31T23:59:59Z"), 2026, 6)).toBe(false);
    expect(isInMonth(new Date("2026-07-01T00:00:00Z"), 2026, 6)).toBe(false);
  });

  it("monthly scores do not carry into the next month", () => {
    const transactions = [
      tx({ eventDate: new Date("2026-06-30T00:00:00Z"), cases: 50 }),
      tx({ eventDate: new Date("2026-07-01T00:00:00Z"), cases: 3 }),
    ];
    const june = filterByMonth(transactions, 2026, 6);
    const july = filterByMonth(transactions, 2026, 7);
    expect(june).toHaveLength(1);
    expect(july).toHaveLength(1);
    expect(june[0].cases).toBe(50);
    expect(july[0].cases).toBe(3);
  });

  it("monthly aggregation sums cases across the month, not teeth", () => {
    const transactions = [
      tx({ eventDate: new Date("2026-06-01T00:00:00Z"), cases: 40 }),
      tx({ eventDate: new Date("2026-06-15T00:00:00Z"), cases: 35 }),
      tx({ eventDate: new Date("2026-06-30T00:00:00Z"), cases: 50 }),
    ];
    const june = filterByMonth(transactions, 2026, 6);
    expect(june.reduce((sum, t) => sum + (t.cases ?? 0), 0)).toBe(125);
  });
});
