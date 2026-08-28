import { describe, expect, it } from "vitest";
import { computeEmployeeOfMonth, filterByMonth, isInMonth } from "./monthly";
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

describe("computeEmployeeOfMonth — uses the corrected case-based score", () => {
  it("picks the single highest final score with no tiebreak needed", () => {
    const transactions = [
      tx({ employeeId: "a", cases: 30 }),
      tx({ employeeId: "b", cases: 10 }),
    ];
    const result = computeEmployeeOfMonth(["a", "b"], transactions, 2026, 6);
    expect(result.status).toBe("winner");
    if (result.status === "winner") {
      expect(result.winner.employeeId).toBe("a");
      expect(result.tieBrokenBy).toBeNull();
    }
  });

  it("breaks a final-score tie using cases completed (production volume)", () => {
    const transactions = [
      // a: 10 completed, 5 returned -> final 5
      tx({ employeeId: "a", cases: 10 }),
      tx({
        employeeId: "a",
        type: "PRODUCTION_REWORK",
        cases: 5,
        responsibility: "DEPARTMENT_FAULT",
      }),
      // b: 5 completed, 0 returned -> final 5, same as a, but lower volume
      tx({ employeeId: "b", cases: 5 }),
    ];
    const result = computeEmployeeOfMonth(["a", "b"], transactions, 2026, 6);
    expect(result.status).toBe("winner");
    if (result.status === "winner") {
      expect(result.winner.employeeId).toBe("a");
      expect(result.tieBrokenBy).toBe("cases_completed");
    }
  });

  it("reports an explicit tie instead of silently picking a winner", () => {
    const transactions = [
      tx({ employeeId: "a", cases: 10 }),
      tx({ employeeId: "b", cases: 10 }),
    ];
    const result = computeEmployeeOfMonth(["a", "b"], transactions, 2026, 6);
    expect(result.status).toBe("tie");
    if (result.status === "tie") {
      expect(result.tiedCandidates.map((c) => c.employeeId).sort()).toEqual([
        "a",
        "b",
      ]);
    }
  });

  it("excludes an eligible employee who had no activity that month", () => {
    const transactions = [tx({ employeeId: "a", cases: 10 })];
    const result = computeEmployeeOfMonth(["a", "b"], transactions, 2026, 6);
    expect(result.status).toBe("winner");
    if (result.status === "winner") {
      expect(result.winner.employeeId).toBe("a");
    }
  });

  it("returns 'none' when nobody had activity that month", () => {
    const result = computeEmployeeOfMonth(["a", "b"], [], 2026, 6);
    expect(result.status).toBe("none");
  });

  it("only considers eligible employee ids, ignoring inactive/unlisted employees", () => {
    const transactions = [
      tx({ employeeId: "a", cases: 5 }),
      tx({ employeeId: "inactive-emp", cases: 999 }),
    ];
    const result = computeEmployeeOfMonth(["a"], transactions, 2026, 6);
    expect(result.status).toBe("winner");
    if (result.status === "winner") {
      expect(result.winner.employeeId).toBe("a");
    }
  });
});
