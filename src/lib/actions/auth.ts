"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSession, establishSession } from "@/lib/auth/current-admin";

export interface ActionResult {
  error?: string;
}

/** Only usable once — creates the single Admin account. Refuses if one already exists. */
export async function setupFirstAdmin(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const existingCount = await prisma.admin.count();
  if (existingCount > 0) {
    return { error: "An admin account already exists." };
  }

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (username.length < 3) {
    return { error: "Username must be at least 3 characters." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const admin = await prisma.admin.create({
    data: { username, passwordHash: await hashPassword(password) },
  });

  await establishSession(admin.id);
  redirect("/admin");
}

export async function loginAdmin(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return { error: "Incorrect username or password." };
  }

  await establishSession(admin.id);
  const next = String(formData.get("next") ?? "/admin");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAdmin(): Promise<void> {
  await clearSession();
  redirect("/");
}
