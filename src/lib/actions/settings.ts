"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/current-admin";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export interface ChangePasswordResult {
  error?: string;
  success?: boolean;
}

export async function changeAdminPassword(
  _prev: ChangePasswordResult,
  formData: FormData,
): Promise<ChangePasswordResult> {
  const admin = await requireAdmin();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const record = await prisma.admin.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await verifyPassword(currentPassword, record.passwordHash))) {
    return { error: "Current password is incorrect." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return { success: true };
}
