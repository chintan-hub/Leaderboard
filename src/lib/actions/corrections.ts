"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/current-admin";
import { validateCorrection } from "@/lib/scoring/validation";
import type { ActionResult } from "./auth";

function originalAmount(original: { type: string; cases: number | null; points: number | null }): number {
  if (original.type === "PRODUCTION_COMPLETED" || original.type === "PRODUCTION_REWORK") {
    return original.cases ?? 0;
  }
  // MANUAL_BONUS / MANUAL_DEDUCTION always contribute a magnitude of 1 to their bucket.
  return Math.abs(original.points ?? 0);
}

/**
 * Creates a correction transaction. NEVER modifies or deletes the original
 * row — the original stays exactly as recorded, and this adds a new,
 * separately-dated, separately-reasoned ledger entry that nets against it.
 * Every score view re-derives from the full ledger, so this alone is enough
 * to make every downstream number (leaderboards, monthly results, employee
 * totals) reflect the correction — no cached total to fix up.
 */
export async function correctTransaction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const originalId = String(formData.get("originalId") ?? "");
  const correctedValue = Number(formData.get("correctedValue"));
  const reason = String(formData.get("reason") ?? "");

  const original = await prisma.scoreTransaction.findUnique({
    where: { id: originalId },
    include: { correctedBy: { select: { id: true } } },
  });
  if (!original) return { error: "Original transaction not found." };
  if (original.correctedBy) {
    return { error: "This transaction has already been corrected once." };
  }

  const validation = validateCorrection(
    { type: original.type, responsibility: original.responsibility },
    {
      originalType: original.type,
      originalAmount: originalAmount(original),
      correctedValue,
      reason,
    },
  );
  if (!validation.valid || !validation.target) {
    return { error: validation.errors.join(" ") || "Unable to correct this transaction." };
  }

  await prisma.scoreTransaction.create({
    data: {
      type: "CORRECTION",
      employeeId: original.employeeId,
      departmentId: original.departmentId,
      points: validation.delta,
      correctionTarget: validation.target,
      reason,
      // Reuses the ORIGINAL event date so the fix retroactively lands in
      // the correct month, even though it's entered later.
      eventDate: original.eventDate,
      correctsTransactionId: original.id,
      createdByAdminId: admin.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/monthly");
  revalidatePath("/employees");
  redirect("/activity");
}
