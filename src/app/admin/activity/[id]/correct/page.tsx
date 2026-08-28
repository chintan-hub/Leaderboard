import Link from "next/link";
import { notFound } from "next/navigation";
import { getTransactionForCorrection } from "@/lib/queries";
import { Card, SectionTitle } from "@/components/ui";
import CorrectionForm from "./correction-form";

const TYPE_LABEL: Record<string, string> = {
  PRODUCTION_COMPLETED: "Cases completed",
  PRODUCTION_REWORK: "Cases returned",
  MANUAL_BONUS: "Manual +1 bonus",
  MANUAL_DEDUCTION: "Manual -1 deduction",
};

export default async function CorrectTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const original = await getTransactionForCorrection(id);

  if (!original) notFound();

  const isCorrection = original.type === "CORRECTION";
  const alreadyCorrected = original.correctedBy !== null;
  const originalAmount =
    original.type === "PRODUCTION_COMPLETED" || original.type === "PRODUCTION_REWORK"
      ? (original.cases ?? 0)
      : 1;

  return (
    <div className="max-w-lg space-y-6">
      <SectionTitle subtitle="The original entry is never changed or deleted — this adds a new, reasoned adjustment on top of it.">
        Correct an Entry
      </SectionTitle>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Original entry (unchanged, stays in the audit trail)
        </p>
        <div className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Employee</span>
            <span className="font-semibold text-foreground">{original.employee.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Department</span>
            <span className="font-semibold text-foreground">{original.department.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Type</span>
            <span className="font-semibold text-foreground">{TYPE_LABEL[original.type] ?? original.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Recorded value</span>
            <span className="font-semibold text-foreground">{originalAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Date</span>
            <span className="font-semibold text-foreground">
              {original.eventDate.toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Original reason</span>
            <span className="font-semibold text-foreground">{original.reason}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Recorded by</span>
            <span className="font-semibold text-foreground">{original.createdByAdmin.username}</span>
          </div>
        </div>
      </Card>

      {isCorrection ? (
        <Card className="border-info/40 bg-info-tint text-sm text-info">
          This is itself a correction and can&apos;t be corrected again. If it was entered wrong, ask an
          admin to review it directly in the database, or record a fresh adjustment for the underlying
          entry instead.
        </Card>
      ) : alreadyCorrected ? (
        <Card className="border-info/40 bg-info-tint text-sm text-info">
          This entry has already been corrected once. See{" "}
          <Link href="/activity" className="font-semibold underline">
            Activity History
          </Link>{" "}
          for the correction.
        </Card>
      ) : (
        <CorrectionForm originalId={original.id} originalAmount={originalAmount} />
      )}

      <Link href="/activity" className="inline-block text-sm font-semibold text-muted underline">
        ← Back to Activity History
      </Link>
    </div>
  );
}
