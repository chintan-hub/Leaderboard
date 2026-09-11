"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/current-admin";
import type { ActionResult } from "./auth";

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Creates a new department. Departments are configurable rather than
 * hard-coded — this is how the lab adds a department beyond the initial
 * roster.
 */
export async function createDepartment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { error: "Department name must be at least 2 characters." };
  }

  const slug = slugify(name);
  const existing = await prisma.department.findUnique({ where: { slug } });
  if (existing) {
    return { error: `A department named "${name}" already exists.` };
  }

  const count = await prisma.department.count();
  await prisma.department.create({
    data: { name, slug, sortOrder: count + 1 },
  });

  revalidatePath("/departments");
  return {};
}

/**
 * Renames a department. Name changes keep the existing slug (it's only used
 * as a stable identifier, not shown to users), so historical links/filters
 * by department id are unaffected. Every employee and point event stays
 * attached via the department's id, never its name, so a rename never
 * alters or loses history.
 */
export async function updateDepartment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2) {
    return { error: "Department name must be at least 2 characters." };
  }

  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) return { error: "Department not found." };

  if (name !== department.name) {
    const targetSlug = slugify(name);
    const existingDepartments = await prisma.department.findMany({
      where: { NOT: { id } },
      select: { slug: true },
    });
    if (existingDepartments.some((d) => d.slug === targetSlug)) {
      return { error: `A department named "${name}" already exists.` };
    }
  }

  await prisma.department.update({ where: { id }, data: { name } });

  revalidatePath("/departments");
  revalidatePath("/");
  revalidatePath("/monthly");
  revalidatePath("/display");
  return {};
}

/**
 * Toggles a department between active and archived. Archiving is the safe
 * alternative to deletion for a department with history — it stops showing
 * up for active picklists while every past record stays exactly as it was
 * (same pattern as `setEmployeeActive`).
 */
export async function setDepartmentActive(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";

  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) return { error: "Department not found." };

  await prisma.department.update({ where: { id }, data: { isActive } });

  revalidatePath("/departments");
  revalidatePath("/");
  revalidatePath("/monthly");
  revalidatePath("/display");
  return {};
}

/**
 * Deletes a department only when nothing references it. Employees and
 * ScoreTransactions carry a required, RESTRICT-on-delete foreign key to
 * Department, so the database itself would refuse a delete with dependents —
 * this check exists to give the admin a clear explanation instead of a raw
 * constraint error, with the database as the backstop.
 */
export async function deleteDepartment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");

  const department = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { employees: true, transactions: true } } },
  });
  if (!department) return { error: "Department not found." };

  if (department._count.employees > 0 || department._count.transactions > 0) {
    return {
      error: `"${department.name}" can't be deleted — it has ${department._count.employees} employee${
        department._count.employees === 1 ? "" : "s"
      } and ${department._count.transactions} historical record${
        department._count.transactions === 1 ? "" : "s"
      } attached. Archive it instead to hide it while keeping that history intact.`,
    };
  }

  await prisma.department.delete({ where: { id } });

  revalidatePath("/departments");
  revalidatePath("/");
  revalidatePath("/monthly");
  revalidatePath("/display");
  return {};
}
