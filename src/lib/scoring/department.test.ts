import { describe, expect, it } from "vitest";
import { rankDepartments } from "./department";
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
    eventDate: new Date("2026-06-15T00:00:00Z"),
    ...overrides,
  };
}

describe("rankDepartments — normalized metric, based on cases not teeth", () => {
  it("a smaller department can outrank a bigger one on average net cases", () => {
    // Design: 2 employees, 10 cases each -> total 20, avg 10
    const designTx = [
      tx({ departmentId: "design", employeeId: "d1", cases: 10 }),
      tx({ departmentId: "design", employeeId: "d2", cases: 10 }),
    ];
    // Build Up: 5 employees, 6 cases each -> total 30 (bigger total), avg 6
    const buildUpTx = [1, 2, 3, 4, 5].map((n) =>
      tx({ departmentId: "buildup", employeeId: `b${n}`, cases: 6 }),
    );

    const results = rankDepartments([
      {
        departmentId: "design",
        departmentName: "Design",
        rankingMetric: "AVG_NET_PER_EMPLOYEE",
        employeeIds: ["d1", "d2"],
        transactions: designTx,
      },
      {
        departmentId: "buildup",
        departmentName: "Build Up",
        rankingMetric: "AVG_NET_PER_EMPLOYEE",
        employeeIds: ["b1", "b2", "b3", "b4", "b5"],
        transactions: buildUpTx,
      },
    ]);

    expect(results[0].departmentId).toBe("design"); // higher average wins
    expect(results[0].metricValue).toBe(10);
    expect(results[1].departmentId).toBe("buildup");
    expect(results[1].metricValue).toBe(6);
    // Totals are still available, not hidden, even though they don't drive the ranking.
    expect(results[1].totalProductionScore).toBe(30);
  });

  it("TOTAL_NET_PRODUCTION metric ranks by raw total cases instead", () => {
    const results = rankDepartments([
      {
        departmentId: "design",
        departmentName: "Design",
        rankingMetric: "TOTAL_NET_PRODUCTION",
        employeeIds: ["d1"],
        transactions: [tx({ departmentId: "design", employeeId: "d1", cases: 5 })],
      },
      {
        departmentId: "buildup",
        departmentName: "Build Up",
        rankingMetric: "TOTAL_NET_PRODUCTION",
        employeeIds: ["b1", "b2"],
        transactions: [
          tx({ departmentId: "buildup", employeeId: "b1", cases: 4 }),
          tx({ departmentId: "buildup", employeeId: "b2", cases: 4 }),
        ],
      },
    ]);
    expect(results[0].departmentId).toBe("buildup"); // 8 > 5
  });

  it("a 32-tooth case and a 1-tooth case contribute identically to department totals — only the case count is tracked", () => {
    const results = rankDepartments([
      {
        departmentId: "design",
        departmentName: "Design",
        rankingMetric: "TOTAL_NET_PRODUCTION",
        employeeIds: ["d1", "d2"],
        transactions: [
          tx({ departmentId: "design", employeeId: "d1", cases: 1 }),
          tx({ departmentId: "design", employeeId: "d2", cases: 1 }),
        ],
      },
    ]);
    expect(results[0].totalCasesCompleted).toBe(2);
    expect(results[0].metricValue).toBe(2);
  });

  it("respects a department's scoringRule (MANUAL_POINTS_ONLY excludes production from the ranking)", () => {
    const results = rankDepartments([
      {
        departmentId: "design",
        departmentName: "Design",
        rankingMetric: "AVG_NET_PER_EMPLOYEE",
        scoringRule: "MANUAL_POINTS_ONLY",
        employeeIds: ["d1"],
        transactions: [tx({ departmentId: "design", employeeId: "d1", cases: 100 })],
      },
    ]);
    expect(results[0].totalProductionScore).toBe(0); // production logged but not scored
    expect(results[0].totalCasesCompleted).toBe(100); // still shown for transparency
    expect(results[0].metricValue).toBe(0);
  });

  it("a department with zero employees does not divide by zero", () => {
    const results = rankDepartments([
      {
        departmentId: "empty",
        departmentName: "Empty",
        rankingMetric: "AVG_NET_PER_EMPLOYEE",
        employeeIds: [],
        transactions: [],
      },
    ]);
    expect(results[0].metricValue).toBe(0);
  });
});
