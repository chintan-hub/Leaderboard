"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { recordManualPoint } from "@/lib/actions/manual-points";
import { Card, Field, FormError, TextInput } from "@/components/ui";

type Direction = "BONUS" | "DEDUCTION";

function newBatchId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ManualPointForm({
  employees,
}: {
  employees: { id: string; label: string }[];
}) {
  const [direction, setDirection] = useState<Direction>("BONUS");
  const [state, formAction, pending] = useActionState(recordManualPoint, {});
  // A fresh id per submission attempt, without deriving it in an effect: track the
  // previous `state` reference and roll the id during render when it changes
  // (React's documented pattern for resetting state in response to a prop/value change).
  const [batchId, setBatchId] = useState(newBatchId);
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    setBatchId(newBatchId());
  }

  if (employees.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          No employees yet. Add one on the{" "}
          <Link href="/employees" className="font-semibold underline">
            Employees
          </Link>{" "}
          page first.
        </p>
      </Card>
    );
  }

  return (
    <Card raised className="max-w-lg">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="direction" value={direction} />
        <input type="hidden" name="batchId" value={batchId} />

        <div className="flex gap-1 rounded-lg bg-silver-tint p-1">
          <button
            type="button"
            onClick={() => setDirection("BONUS")}
            className={`focus-ring flex-1 rounded-md py-2 text-sm font-semibold transition ${
              direction === "BONUS" ? "bg-white text-positive shadow-surface" : "text-muted hover:text-foreground"
            }`}
          >
            +1 Bonus
          </button>
          <button
            type="button"
            onClick={() => setDirection("DEDUCTION")}
            className={`focus-ring flex-1 rounded-md py-2 text-sm font-semibold transition ${
              direction === "DEDUCTION" ? "bg-white text-negative shadow-surface" : "text-muted hover:text-foreground"
            }`}
          >
            −1 Deduction
          </button>
        </div>

        <Field label="Employee" htmlFor="employeeId">
          <select
            id="employeeId"
            name="employeeId"
            required
            className="focus-ring w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Date" htmlFor="eventDate">
          <TextInput
            id="eventDate"
            name="eventDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </Field>

        <Field label="Reason (required)" htmlFor="reason">
          <TextInput
            id="reason"
            name="reason"
            required
            placeholder={
              direction === "BONUS"
                ? "e.g. Helped another department with urgent work"
                : "e.g. Failed to update required case information"
            }
          />
        </Field>

        <FormError message={state.error} />

        <button
          type="submit"
          disabled={pending}
          className={`focus-ring w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-surface transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
            direction === "BONUS" ? "bg-positive hover:opacity-90" : "bg-negative hover:opacity-90"
          }`}
        >
          {pending ? "Saving…" : direction === "BONUS" ? "Award +1" : "Apply −1"}
        </button>
      </form>
    </Card>
  );
}
