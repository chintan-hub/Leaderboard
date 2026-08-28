import { prisma } from "@/lib/db";
import { SectionTitle } from "@/components/ui";
import ManualPointForm from "./manual-point-form";

export default async function ManualPointsPage() {
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { department: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <SectionTitle subtitle="Separate from production. Every point requires a reason — no unexplained changes.">
        Manual Points
      </SectionTitle>
      <ManualPointForm
        employees={employees.map((e) => ({
          id: e.id,
          label: `${e.name} — ${e.department.name}`,
        }))}
      />
    </div>
  );
}
