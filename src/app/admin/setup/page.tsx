import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SetupForm from "./setup-form";

export default async function AdminSetupPage() {
  const adminCount = await prisma.admin.count();
  if (adminCount > 0) {
    redirect("/admin/login");
  }

  return <SetupForm />;
}
