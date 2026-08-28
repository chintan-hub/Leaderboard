"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { recordManualPoint } from "@/lib/actions/manual-points";
import { Card, FormError } from "@/components/ui";

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
    <Card className="max-w-lg">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="direction" value={direction} />
        <input type="hidden" name="batchId" value={batchId} />

        <div className="flex gap-2 rounded-lg bg-silver-tint p-1">
          <button
            type="button"
            onClick={() => setDirection("BONUS")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
              direction === "BONUS" ? "bg-white text-positive shadow-sm" : "text-muted"
            }`}
          >
            +1 Bonus
          </button>
          <button
            type="button"
            onClick={() => setDirection("DEDUCTION")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
              direction === "DEDUCTION" ? "bg-white text-negative shadow-sm" : "text-muted"
            }`}
          >
            −1 Deduction
          </button>
        </div>

        <div>
          <label htmlFor="employeeId" className="block text-sm font-medium text-foreground">
            Employee
          </label>
          <select
            id="employeeId"
            name="employeeId"
            required
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium text-foreground">
            Date
          </label>
          <input
            id="eventDate"
            name="eventDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-foreground">
            Reason (required)
          </label>
          <input
            id="reason"
            name="reason"
            required
            placeholder={
              direction === "BONUS"
                ? "e.g. Helped another department with urgent work"
                : "e.g. Failed to update required case information"
            }
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>

        <FormError message={state.error} />

        <button
          type="submit"
          disabled={pending}
          className={`w-full rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
            direction === "BONUS" ? "bg-positive hover:opacity-90" : "bg-negative hover:opacity-90"
          }`}
        >
          {pending ? "Saving…" : direction === "BONUS" ? "Award +1" : "Apply −1"}
        </button>
      </form>
    </Card>
  );
}
