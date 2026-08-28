import { describe, expect, it } from "vitest";
import { computeRankMovement, rankEmployees } from "./leaderboard";
import type { ScoreTransactionInput } from "./types";

function tx(overrides: Partial<ScoreTransactionInput>): ScoreTransactionInput {
  return {
    id: overrides.id ?? `tx-${Math.random()}`,
    type: "PRODUCTION_COMPLETED",
    employeeId: "emp",
    departmentId: "dept",
    cases: 1,
    points: null,
    responsibility: null,
    correctionTarget: null,
    eventDate: new Date("2026-08-15T00:00:00Z"),
    ...overrides,
  };
}

describe("rankEmployees", () => {
  it("ranks by final score, highest first", () => {
    const transactions = [
      tx({ employeeId: "a", cases: 10 }),
      tx({ employeeId: "b", cases: 30 }),
      tx({ employeeId: "c", cases: 20 }),
    ];
    const ranked = rankEmployees(["a", "b", "c"], transactions);
    expect(ranked.map((r) => r.employeeId)).toEqual(["b", "c", "a"]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("includes employees with zero activity, ranked at the bottom", () => {
    const transactions = [tx({ employeeId: "a", cases: 10 })];
    const ranked = rankEmployees(["a", "idle"], transactions);
    expect(ranked[0].employeeId).toBe("a");
    expect(ranked[1].employeeId).toBe("idle");
    expect(ranked[1].summary.finalScore).toBe(0);
  });

  it("breaks ties deterministically by employeeId so repeated calls agree", () => {
    const transactions = [
      tx({ employeeId: "b", cases: 5 }),
      tx({ employeeId: "a", cases: 5 }),
    ];
    const first = rankEmployees(["a", "b"], transactions);
    const second = rankEmployees(["a", "b"], transactions);
    expect(first.map((r) => r.employeeId)).toEqual(second.map((r) => r.employeeId));
  });

  it("respects a per-employee scoring rule", () => {
    const transactions = [
      tx({ employeeId: "a", cases: 100 }),
      tx({ employeeId: "b", type: "MANUAL_BONUS", points: 1 }),
    ];
    const ranked = rankEmployees(
      ["a", "b"],
      transactions,
      new Map([["a", "MANUAL_POINTS_ONLY"]]),
    );
    // a's 100 cases don't count under MANUAL_POINTS_ONLY, so b's +1 wins.
    expect(ranked[0].employeeId).toBe("b");
  });

  it("handles an empty roster without error (zero-data state)", () => {
    expect(rankEmployees([], [])).toEqual([]);
  });
});

describe("computeRankMovement", () => {
  it("reports upward movement", () => {
    const previous = rankEmployees(["a", "b"], [tx({ employeeId: "a", cases: 5 }), tx({ employeeId: "b", cases: 10 })]);
    const current = rankEmployees(["a", "b"], [tx({ employeeId: "a", cases: 20 }), tx({ employeeId: "b", cases: 10 })]);
    const movement = computeRankMovement(current, previous);
    expect(movement.get("a")?.delta).toBe(1); // was rank 2, now rank 1
    expect(movement.get("b")?.delta).toBe(-1); // was rank 1, now rank 2
  });

  it("reports zero delta for an unchanged rank", () => {
    const snapshot = rankEmployees(["a", "b"], [tx({ employeeId: "a", cases: 10 }), tx({ employeeId: "b", cases: 5 })]);
    const movement = computeRankMovement(snapshot, snapshot);
    expect(movement.get("a")?.delta).toBe(0);
    expect(movement.get("b")?.delta).toBe(0);
  });

  it("omits an employee who has no entry in the previous snapshot", () => {
    const previous = rankEmployees(["a"], [tx({ employeeId: "a", cases: 5 })]);
    const current = rankEmployees(["a", "new-hire"], [tx({ employeeId: "a", cases: 5 })]);
    const movement = computeRankMovement(current, previous);
    expect(movement.has("new-hire")).toBe(false);
    expect(movement.has("a")).toBe(true);
  });
});
