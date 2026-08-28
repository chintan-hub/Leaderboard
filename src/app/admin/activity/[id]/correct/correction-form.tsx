"use client";

import { useActionState, useState } from "react";
import { correctTransaction } from "@/lib/actions/corrections";
import { Card, Field, FormError, TextInput } from "@/components/ui";

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
    <Card raised>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="originalId" value={originalId} />

        <Field label="What should this have been?" htmlFor="correctedValue">
          <TextInput
            id="correctedValue"
            name="correctedValue"
            type="number"
            min={0}
            step={1}
            required
            value={correctedValue}
            onChange={(e) => setCorrectedValue(e.target.value)}
          />
        </Field>

        <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
          <span className="text-muted">Correction amount: </span>
          <span className={`font-bold tabular-nums ${delta < 0 ? "text-negative" : "text-positive"}`}>
            {delta >= 0 ? "+" : ""}
            {delta}
          </span>
        </div>

        <Field label="Reason for correction (required)" htmlFor="reason">
          <TextInput id="reason" name="reason" required placeholder="e.g. Entered 25 instead of 15" />
        </Field>

        <FormError message={state.error} />

        <button
          type="submit"
          disabled={pending || delta === 0}
          className="focus-ring w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-surface transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-violet-500"
        >
          {pending ? "Saving correction…" : "Save Correction"}
        </button>
      </form>
    </Card>
  );
}
