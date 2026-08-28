"use client";

import { useActionState, useState } from "react";
import { correctTransaction } from "@/lib/actions/corrections";
import { Card, FormError } from "@/components/ui";

export default function CorrectionForm({
  originalId,
  originalAmount,
}: {
  originalId: string;
  originalAmount: number;
}) {
  const [state, formAction, pending] = useActionState(correctTransaction, {});
  const [correctedValue, setCorrectedValue] = useState(String(originalAmount));

  const parsed = Number(correctedValue);
  const delta = Number.isFinite(parsed) ? parsed - originalAmount : 0;

  return (
    <Card>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="originalId" value={originalId} />

        <div>
          <label htmlFor="correctedValue" className="block text-sm font-medium text-foreground">
            What should this have been?
          </label>
          <input
            id="correctedValue"
            name="correctedValue"
            type="number"
            min={0}
            step={1}
            required
            value={correctedValue}
            onChange={(e) => setCorrectedValue(e.target.value)}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>

        <div className="rounded-md bg-background px-3 py-2 text-sm">
          <span className="text-muted">Correction amount: </span>
          <span className={`font-bold tabular-nums ${delta < 0 ? "text-negative" : "text-positive"}`}>
            {delta >= 0 ? "+" : ""}
            {delta}
          </span>
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-foreground">
            Reason for correction (required)
          </label>
          <input
            id="reason"
            name="reason"
            required
            placeholder="e.g. Entered 25 instead of 15"
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>

        <FormError message={state.error} />

        <button
          type="submit"
          disabled={pending || delta === 0}
          className="w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {pending ? "Saving correction…" : "Save Correction"}
        </button>
      </form>
    </Card>
  );
}
