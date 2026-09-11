import { prisma } from "@/lib/db";
import { SectionTitle } from "@/components/ui";
import PointForm from "./point-form";

export default async function AwardPointsPage() {
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { department: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <SectionTitle subtitle="Recognize good behaviour or record an accountability issue. Every point requires a category and a reason — no unexplained changes.">
        Award Points
      </SectionTitle>
      <PointForm
        employees={employees.map((e) => ({
          id: e.id,
          label: `${e.name} — ${e.department.name}`,
        }))}
      />
    </div>
  );
}
