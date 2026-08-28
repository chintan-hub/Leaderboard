import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import LoginForm from "./login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    redirect("/admin/setup");
  }

  const { next } = await searchParams;
  return <LoginForm next={next ?? "/admin"} />;
}
