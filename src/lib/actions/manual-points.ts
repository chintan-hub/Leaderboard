"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/current-admin";
import { validateNewTransaction } from "@/lib/scoring/validation";
import type { ActionResult } from "./auth";

/** Records a +1 bonus or -1 deduction. A reason is always required — no unexplained manual changes. */
export async function recordManualPoint(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const employeeId = String(formData.get("employeeId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const eventDateRaw = String(formData.get("eventDate") ?? "");
  const eventDate = eventDateRaw ? new Date(`${eventDateRaw}T00:00:00Z`) : new Date();
  const batchId = String(formData.get("batchId") ?? "") || null;

  if (batchId) {
    const existing = await prisma.scoreTransaction.findFirst({ where: { batchId } });
    if (existing) return {};
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, departmentId: true },
  });
  if (!employee) return { error: "Select a valid employee." };

  const type = direction === "BONUS" ? "MANUAL_BONUS" : "MANUAL_DEDUCTION";

  const validation = validateNewTransaction({
    type,
    employeeId,
    departmentId: employee.departmentId,
    points: 1,
    reason,
    eventDate,
  });
  if (!validation.valid) return { error: validation.errors.join(" ") };

  await prisma.scoreTransaction.create({
    data: {
      type,
      employeeId,
      departmentId: employee.departmentId,
      points: 1,
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
