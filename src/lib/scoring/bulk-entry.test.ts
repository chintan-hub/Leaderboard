import { describe, expect, it } from "vitest";
import { buildBulkProductionTransactions } from "./bulk-entry";

const DEPT = "dept-design";
const DATE = new Date("2026-08-28T00:00:00Z");

describe("buildBulkProductionTransactions — Design worked example (Priya 8/1, Ravi 6/0, Neha 9/2)", () => {
  it("creates exactly the right transactions for multiple employees in one submission", () => {
    const result = buildBulkProductionTransactions({
      departmentId: DEPT,
      eventDate: DATE,
      completedReason: "Daily production entry",
      reworkTrackingEnabled: true,
      rows: [
        { employeeId: "priya", completed: 8, rework: 1, reworkResponsibility: "DEPARTMENT_FAULT", reworkReason: "Design error" },
        { employeeId: "ravi", completed: 6, rework: 0 },
        { employeeId: "neha", completed: 9, rework: 2, reworkResponsibility: "DEPARTMENT_FAULT", reworkReason: "Design error" },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Priya: 1 completed + 1 returned, Ravi: 1 completed only, Neha: 1 completed + 1 returned = 5 rows total
    expect(result.transactions).toHaveLength(5);

    const priyaCompleted = result.transactions.find(
      (t) => t.employeeId === "priya" && t.type === "PRODUCTION_COMPLETED",
    );
    expect(priyaCompleted?.cases).toBe(8);

    const priyaReturned = result.transactions.find(
      (t) => t.employeeId === "priya" && t.type === "PRODUCTION_REWORK",
    );
    expect(priyaReturned?.cases).toBe(1);
    expect(priyaReturned?.responsibility).toBe("DEPARTMENT_FAULT");

    const raviRows = result.transactions.filter((t) => t.employeeId === "ravi");
    expect(raviRows).toHaveLength(1); // no return row created for 0 returned
    expect(raviRows[0].type).toBe("PRODUCTION_COMPLETED");
    expect(raviRows[0].cases).toBe(6);

    const nehaReturned = result.transactions.find(
      (t) => t.employeeId === "neha" && t.type === "PRODUCTION_REWORK",
    );
    expect(nehaReturned?.cases).toBe(2);
  });

  it("treats an empty/zero value as 'nothing to record', not a zero transaction", () => {
    const result = buildBulkProductionTransactions({
      departmentId: DEPT,
      eventDate: DATE,
      completedReason: "Daily production entry",
      reworkTrackingEnabled: true,
      rows: [
        { employeeId: "priya", completed: 8, rework: 0 },
        { employeeId: "idle-today", completed: 0, rework: 0 },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.transactions.every((t) => t.employeeId !== "idle-today")).toBe(true);
    expect(result.transactions).toHaveLength(1);
  });

  it("a case returned for an external reason is prepared with EXTERNAL_NOT_FAULT and no deduction happens at this layer (that's score.ts's job)", () => {
    const result = buildBulkProductionTransactions({
      departmentId: DEPT,
      eventDate: DATE,
      completedReason: "Daily production entry",
      reworkTrackingEnabled: true,
      rows: [
        {
          employeeId: "priya",
          completed: 10,
          rework: 2,
          reworkResponsibility: "EXTERNAL_NOT_FAULT",
          reworkReason: "Doctor specification changed",
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const returned = result.transactions.find((t) => t.type === "PRODUCTION_REWORK");
    expect(returned?.responsibility).toBe("EXTERNAL_NOT_FAULT");
  });

  it("rejects a returned case with no responsibility selected", () => {
    const result = buildBulkProductionTransactions({
      departmentId: DEPT,
      eventDate: DATE,
      completedReason: "Daily production entry",
      reworkTrackingEnabled: true,
      rows: [{ employeeId: "priya", completed: 5, rework: 2 }],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a returned case with no reason", () => {
    const result = buildBulkProductionTransactions({
      departmentId: DEPT,
      eventDate: DATE,
      completedReason: "Daily production entry",
      reworkTrackingEnabled: true,
      rows: [
        { employeeId: "priya", completed: 5, rework: 2, reworkResponsibility: "DEPARTMENT_FAULT" },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects returned cases entirely when the department has return tracking disabled", () => {
    const result = buildBulkProductionTransactions({
      departmentId: DEPT,
      eventDate: DATE,
      completedReason: "Daily production entry",
      reworkTrackingEnabled: false,
      rows: [
        {
          employeeId: "priya",
          completed: 5,
          rework: 2,
          reworkResponsibility: "DEPARTMENT_FAULT",
          reworkReason: "Design error",
        },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects negative completed or returned case counts", () => {
    expect(
      buildBulkProductionTransactions({
        departmentId: DEPT,
        eventDate: DATE,
        completedReason: "Daily production entry",
        reworkTrackingEnabled: true,
        rows: [{ employeeId: "priya", completed: -1, rework: 0 }],
      }).ok,
    ).toBe(false);
  });

  it("rejects a duplicate employee within the same submission", () => {
    const result = buildBulkProductionTransactions({
      departmentId: DEPT,
      eventDate: DATE,
      completedReason: "Daily production entry",
      reworkTrackingEnabled: true,
      rows: [
        { employeeId: "priya", completed: 5, rework: 0 },
        { employeeId: "priya", completed: 3, rework: 0 },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty submission with no rows", () => {
    const result = buildBulkProductionTransactions({
      departmentId: DEPT,
      eventDate: DATE,
      completedReason: "Daily production entry",
      reworkTrackingEnabled: true,
      rows: [],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a submission where every row is 0/0 (nothing to save)", () => {
    const result = buildBulkProductionTransactions({
      departmentId: DEPT,
      eventDate: DATE,
      completedReason: "Daily production entry",
      reworkTrackingEnabled: true,
      rows: [
        { employeeId: "priya", completed: 0, rework: 0 },
        { employeeId: "ravi", completed: 0, rework: 0 },
      ],
    });
    expect(result.ok).toBe(false);
  });
});
