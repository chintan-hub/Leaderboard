import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { prisma } from "@/lib/db";
import { Card, SectionTitle } from "@/components/ui";
import ChangePasswordForm from "./change-password-form";

export default async function AdminSettingsPage() {
  const admin = await getCurrentAdmin();
  const [departmentCount, employeeCount, transactionCount] = await Promise.all([
    prisma.department.count(),
    prisma.employee.count(),
    prisma.scoreTransaction.count(),
  ]);

  return (
    <div className="space-y-8">
      <SectionTitle>Admin Settings</SectionTitle>

      <Card className="max-w-md">
        <h3 className="font-bold text-foreground">Account</h3>
        <dl className="mt-3 space-y-1 text-sm text-muted">
          <div className="flex justify-between">
            <dt>Username</dt>
            <dd className="font-semibold text-foreground">{admin?.username}</dd>
          </div>
        </dl>
      </Card>

      <div className="max-w-md">
        <h3 className="mb-2 font-bold text-foreground">Change Password</h3>
        <ChangePasswordForm />
      </div>

      <Card className="max-w-md">
        <h3 className="font-bold text-foreground">System</h3>
        <dl className="mt-3 space-y-1 text-sm text-muted">
          <div className="flex justify-between">
            <dt>Departments</dt>
            <dd className="font-semibold text-foreground">{departmentCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Employees</dt>
            <dd className="font-semibold text-foreground">{employeeCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Recorded transactions</dt>
            <dd className="font-semibold text-foreground">{transactionCount}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
