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
 * hard-coded — this is how a lab adds a department beyond the initial six.
 * New departments default to the same net-production scoring rule; a
 * different rule can be assigned later by editing `scoringRule` once more
 * formulas exist in the registry (src/lib/scoring/*.ts).
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

const VALID_SCORING_RULES = new Set(["NET_PRODUCTION", "MANUAL_POINTS_ONLY"]);
const VALID_RANKING_METRICS = new Set(["AVG_NET_PER_EMPLOYEE", "TOTAL_NET_PRODUCTION"]);

/**
 * Edits a department's settings. Name changes keep the existing slug (it's
 * only used as a stable identifier, not shown to users), so historical
 * links/filters by department id are unaffected.
 */
export async function updateDepartment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const scoringRule = String(formData.get("scoringRule") ?? "");
  const rankingMetric = String(formData.get("rankingMetric") ?? "");
  const productionTrackingEnabled = formData.get("productionTrackingEnabled") === "true";
  const reworkTrackingEnabled = formData.get("reworkTrackingEnabled") === "true";

  if (name.length < 2) {
    return { error: "Department name must be at least 2 characters." };
  }
  if (!VALID_SCORING_RULES.has(scoringRule)) {
    return { error: "Select a valid scoring method." };
  }
  if (!VALID_RANKING_METRICS.has(rankingMetric)) {
    return { error: "Select a valid ranking metric." };
  }

  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) return { error: "Department not found." };

  if (name !== department.name) {
    const nameTaken = await prisma.department.findFirst({
      where: { name, NOT: { id } },
    });
    if (nameTaken) return { error: `A department named "${name}" already exists.` };
  }

  await prisma.department.update({
    where: { id },
    data: {
      name,
      scoringRule,
      rankingMetric,
      productionTrackingEnabled,
      reworkTrackingEnabled,
    },
  });

  revalidatePath("/departments");
  revalidatePath("/");
  revalidatePath("/admin/production");
  return {};
}
