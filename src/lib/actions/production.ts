"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/current-admin";
import { validateNewTransaction } from "@/lib/scoring/validation";
import { buildBulkProductionTransactions, type BulkProductionRow } from "@/lib/scoring/bulk-entry";
import type { ActionResult } from "./auth";

function parseEventDate(formData: FormData): Date {
  const raw = String(formData.get("eventDate") ?? "");
  const date = raw ? new Date(`${raw}T00:00:00Z`) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

async function resolveEmployeeAndDepartment(employeeId: string) {
  return prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, departmentId: true },
  });
}

/** True if a submission with this batchId already created rows — lets a retried/double-clicked submit no-op instead of duplicating. */
async function isDuplicateBatch(batchId: string | null | undefined): Promise<boolean> {
  if (!batchId) return false;
  const existing = await prisma.scoreTransaction.findFirst({ where: { batchId } });
  return existing !== null;
}

/** Records completed cases for an employee: +1 production score per case, regardless of how many teeth it contains. */
export async function recordProductionCompleted(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const employeeId = String(formData.get("employeeId") ?? "");
  const cases = Number(formData.get("cases"));
  const reason = String(formData.get("reason") ?? "");
  const eventDate = parseEventDate(formData);
  const batchId = String(formData.get("batchId") ?? "") || null;

  if (await isDuplicateBatch(batchId)) return {};

  const employee = await resolveEmployeeAndDepartment(employeeId);
  if (!employee) return { error: "Select a valid employee." };

  const validation = validateNewTransaction({
    type: "PRODUCTION_COMPLETED",
    employeeId,
    departmentId: employee.departmentId,
    cases,
    reason,
    eventDate,
  });
  if (!validation.valid) return { error: validation.errors.join(" ") };

  await prisma.scoreTransaction.create({
    data: {
      type: "PRODUCTION_COMPLETED",
      employeeId,
      departmentId: employee.departmentId,
      cases,
      reason,
      eventDate,
      batchId,
      createdByAdminId: admin.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/monthly");
  return {};
}

/**
 * Records a returned case. `responsibility` decides whether this deducts:
 * DEPARTMENT_FAULT deducts from the score, EXTERNAL_NOT_FAULT (e.g. a
 * doctor-requested change) is logged for transparency only.
 */
export async function recordProductionRework(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const employeeId = String(formData.get("employeeId") ?? "");
  const cases = Number(formData.get("cases"));
  const reason = String(formData.get("reason") ?? "");
  const responsibility = String(formData.get("responsibility") ?? "");
  const eventDate = parseEventDate(formData);
  const batchId = String(formData.get("batchId") ?? "") || null;

  if (await isDuplicateBatch(batchId)) return {};

  const employee = await resolveEmployeeAndDepartment(employeeId);
  if (!employee) return { error: "Select a valid employee." };

  const validation = validateNewTransaction({
    type: "PRODUCTION_REWORK",
    employeeId,
    departmentId: employee.departmentId,
    cases,
    reason,
    eventDate,
    responsibility:
      responsibility === "DEPARTMENT_FAULT" || responsibility === "EXTERNAL_NOT_FAULT"
        ? responsibility
        : null,
  });
  if (!validation.valid) return { error: validation.errors.join(" ") };

  await prisma.scoreTransaction.create({
    data: {
      type: "PRODUCTION_REWORK",
      employeeId,
      departmentId: employee.departmentId,
      cases,
      reason,
      eventDate,
      batchId,
      responsibility: responsibility as "DEPARTMENT_FAULT" | "EXTERNAL_NOT_FAULT",
      createdByAdminId: admin.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/monthly");
  return {};
}

export interface BulkProductionPayload {
  departmentId: string;
  eventDate: string; // YYYY-MM-DD
  batchId: string;
  completedNote?: string;
  rows: BulkProductionRow[];
}

export interface BulkProductionResultState {
  error?: string;
  errors?: string[];
  success?: boolean;
  created?: number;
}

/**
 * The fast, whole-department entry path: one Save creates every completed
 * and returned-case transaction for the day in a single database
 * transaction, so either all of it lands or none of it does. Validation
 * happens through the same pure `buildBulkProductionTransactions` the unit
 * tests exercise.
 */
export async function saveBulkProduction(
  payload: BulkProductionPayload,
): Promise<BulkProductionResultState> {
  const admin = await requireAdmin();

  if (await isDuplicateBatch(payload.batchId)) {
    return { success: true, created: 0 };
  }

  const department = await prisma.department.findUnique({ where: { id: payload.departmentId } });
  if (!department) return { error: "Select a valid department." };
  if (!department.productionTrackingEnabled) {
    return { error: `Production tracking is disabled for ${department.name}.` };
  }

  const activeEmployees = await prisma.employee.findMany({
    where: { departmentId: payload.departmentId, isActive: true },
    select: { id: true },
  });
  const activeIds = new Set(activeEmployees.map((e) => e.id));
  const unknownRow = payload.rows.find((r) => !activeIds.has(r.employeeId));
  if (unknownRow) {
    return { error: "One of the employees in this submission is no longer active. Refresh and try again." };
  }

  const eventDate = new Date(`${payload.eventDate}T00:00:00Z`);
  const result = buildBulkProductionTransactions({
    departmentId: payload.departmentId,
    eventDate,
    completedReason: payload.completedNote?.trim() || "Daily production entry",
    reworkTrackingEnabled: department.reworkTrackingEnabled,
    rows: payload.rows,
  });

  if (!result.ok) {
    return { error: result.errors[0], errors: result.errors };
  }

  await prisma.$transaction(
    result.transactions.map((t) =>
      prisma.scoreTransaction.create({
        data: {
          type: t.type,
          employeeId: t.employeeId,
          departmentId: t.departmentId,
          cases: t.cases,
          reason: t.reason,
          responsibility: t.responsibility,
          eventDate: t.eventDate,
          batchId: payload.batchId,
          createdByAdminId: admin.id,
        },
      }),
    ),
  );

  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/monthly");
  revalidatePath("/admin/production");

  return { success: true, created: result.transactions.length };
}
