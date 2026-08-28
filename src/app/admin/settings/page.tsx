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
        <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Account</h3>
        <dl className="mt-2.5 space-y-1.5 text-sm">
          <div className="flex justify-between border-t border-border pt-1.5">
            <dt className="text-muted">Username</dt>
            <dd className="font-semibold text-foreground">{admin?.username}</dd>
          </div>
        </dl>
      </Card>

      <div className="max-w-md">
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Change Password</h3>
        <ChangePasswordForm />
      </div>

      <Card className="max-w-md">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">System</h3>
        <dl className="mt-2.5 space-y-1.5 text-sm">
          <div className="flex justify-between border-t border-border pt-1.5">
            <dt className="text-muted">Departments</dt>
            <dd className="font-semibold text-foreground">{departmentCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Employees</dt>
            <dd className="font-semibold text-foreground">{employeeCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Recorded transactions</dt>
            <dd className="font-semibold text-foreground">{transactionCount}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
