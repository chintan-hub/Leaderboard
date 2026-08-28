"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/current-admin";
import type { ActionResult } from "./auth";

export async function createEmployee(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const departmentId = String(formData.get("departmentId") ?? "");

  if (name.length < 2) {
    return { error: "Employee name must be at least 2 characters." };
  }
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) {
    return { error: "Select a valid department." };
  }

  await prisma.employee.create({ data: { name, departmentId } });

  revalidatePath("/employees");
  revalidatePath("/departments");
  return {};
}

/** Edits name and/or department. Historical transactions keep the department they were recorded under — this only changes where the employee shows up going forward. */
export async function updateEmployee(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const departmentId = String(formData.get("departmentId") ?? "");

  if (name.length < 2) {
    return { error: "Employee name must be at least 2 characters." };
  }
  const [employee, department] = await Promise.all([
    prisma.employee.findUnique({ where: { id } }),
    prisma.department.findUnique({ where: { id: departmentId } }),
  ]);
  if (!employee) return { error: "Employee not found." };
  if (!department) return { error: "Select a valid department." };

  await prisma.employee.update({ where: { id }, data: { name, departmentId } });

  revalidatePath("/employees");
  revalidatePath("/departments");
  revalidatePath("/admin/production");
  revalidatePath("/admin/manual-points");
  return {};
}

/**
 * Deactivating never deletes anything — the employee's full history stays
 * in the ledger exactly as recorded. They just stop appearing in active
 * picklists (production entry, manual points) and current leaderboards.
 * Reactivating is the same toggle in reverse.
 */
export async function setEmployeeActive(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";

  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) return { error: "Employee not found." };

  await prisma.employee.update({ where: { id }, data: { isActive } });

  revalidatePath("/employees");
  revalidatePath("/departments");
  revalidatePath("/");
  revalidatePath("/admin/production");
  revalidatePath("/admin/manual-points");
  return {};
}
