import { describe, expect, it } from "vitest";
import { computeRankMovement, rankEmployees } from "./leaderboard";
import type { ScoreTransactionInput } from "./types";

function tx(overrides: Partial<ScoreTransactionInput>): ScoreTransactionInput {
  return {
    id: overrides.id ?? `tx-${Math.random()}`,
    type: "MANUAL_BONUS",
    employeeId: "emp",
    departmentId: "dept",
    cases: null,
    points: 1,
    responsibility: null,
    correctionTarget: null,
    eventDate: new Date("2026-08-15T00:00:00Z"),
    ...overrides,
  };
}

function bonuses(employeeId: string, count: number): ScoreTransactionInput[] {
  return Array.from({ length: count }, () => tx({ employeeId, type: "MANUAL_BONUS" }));
}

describe("rankEmployees", () => {
  it("ranks by net points, highest first", () => {
    const transactions = [...bonuses("a", 1), ...bonuses("b", 3), ...bonuses("c", 2)];
    const ranked = rankEmployees(["a", "b", "c"], transactions);
    expect(ranked.map((r) => r.employeeId)).toEqual(["b", "c", "a"]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("includes employees with zero activity, ranked at the bottom", () => {
    const transactions = bonuses("a", 1);
    const ranked = rankEmployees(["a", "idle"], transactions);
    expect(ranked[0].employeeId).toBe("a");
    expect(ranked[1].employeeId).toBe("idle");
    expect(ranked[1].summary.netPoints).toBe(0);
  });

  it("breaks ties deterministically by employeeId so repeated calls agree", () => {
    const transactions = [...bonuses("b", 1), ...bonuses("a", 1)];
    const first = rankEmployees(["a", "b"], transactions);
    const second = rankEmployees(["a", "b"], transactions);
    expect(first.map((r) => r.employeeId)).toEqual(second.map((r) => r.employeeId));
  });

  it("ranks a deduction below a recognition", () => {
    const transactions = [tx({ employeeId: "a", type: "MANUAL_DEDUCTION" }), tx({ employeeId: "b", type: "MANUAL_BONUS" })];
    const ranked = rankEmployees(["a", "b"], transactions);
    expect(ranked[0].employeeId).toBe("b");
  });

  it("handles an empty roster without error (zero-data state)", () => {
    expect(rankEmployees([], [])).toEqual([]);
  });
});

describe("computeRankMovement", () => {
  it("reports upward movement", () => {
    const previous = rankEmployees(["a", "b"], [...bonuses("a", 1), ...bonuses("b", 2)]);
    const current = rankEmployees(["a", "b"], [...bonuses("a", 4), ...bonuses("b", 2)]);
    const movement = computeRankMovement(current, previous);
    expect(movement.get("a")?.delta).toBe(1); // was rank 2, now rank 1
    expect(movement.get("b")?.delta).toBe(-1); // was rank 1, now rank 2
  });

  it("reports zero delta for an unchanged rank", () => {
    const snapshot = rankEmployees(["a", "b"], [...bonuses("a", 2), ...bonuses("b", 1)]);
    const movement = computeRankMovement(snapshot, snapshot);
    expect(movement.get("a")?.delta).toBe(0);
    expect(movement.get("b")?.delta).toBe(0);
  });

  it("omits an employee who has no entry in the previous snapshot", () => {
    const previous = rankEmployees(["a"], bonuses("a", 1));
    const current = rankEmployees(["a", "new-hire"], bonuses("a", 1));
    const movement = computeRankMovement(current, previous);
    expect(movement.has("new-hire")).toBe(false);
    expect(movement.has("a")).toBe(true);
  });
});
