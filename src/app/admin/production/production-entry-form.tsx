"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { recordProductionCompleted, recordProductionRework } from "@/lib/actions/production";
import { Card, FormError } from "@/components/ui";

type Mode = "COMPLETED" | "REWORK";

const todayIso = () => new Date().toISOString().slice(0, 10);

function newBatchId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ProductionEntryForm({
  employees,
}: {
  employees: { id: string; label: string }[];
}) {
  const [mode, setMode] = useState<Mode>("COMPLETED");
  const [completedState, completedAction, completedPending] = useActionState(
    recordProductionCompleted,
    {},
  );
  const [reworkState, reworkAction, reworkPending] = useActionState(recordProductionRework, {});
  // A fresh id per submission attempt, rolled during render (not in an
  // effect) whenever the corresponding action result changes — see the
  // matching comment in manual-point-form.tsx for why.
  const [completedBatchId, setCompletedBatchId] = useState(newBatchId);
  const [lastCompletedState, setLastCompletedState] = useState(completedState);
  if (completedState !== lastCompletedState) {
    setLastCompletedState(completedState);
    setCompletedBatchId(newBatchId());
  }
  const [reworkBatchId, setReworkBatchId] = useState(newBatchId);
  const [lastReworkState, setLastReworkState] = useState(reworkState);
  if (reworkState !== lastReworkState) {
    setLastReworkState(reworkState);
    setReworkBatchId(newBatchId());
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
      <div className="mb-4 flex gap-2 rounded-lg bg-silver-tint p-1">
        <button
          type="button"
          onClick={() => setMode("COMPLETED")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            mode === "COMPLETED" ? "bg-white shadow-sm text-positive" : "text-muted"
          }`}
        >
          + Completed
        </button>
        <button
          type="button"
          onClick={() => setMode("REWORK")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            mode === "REWORK" ? "bg-white shadow-sm text-negative" : "text-muted"
          }`}
        >
          − Returned
        </button>
      </div>

      {mode === "COMPLETED" ? (
        <form key="completed" action={completedAction} className="space-y-3">
          <input type="hidden" name="batchId" value={completedBatchId} />
          <EmployeeSelect employees={employees} />
          <CasesInput />
          <DateInput />
          <ReasonInput placeholder="e.g. Case #4821 delivered on time" />
          <FormError message={completedState.error} />
          <button
            type="submit"
            disabled={completedPending}
            className="w-full rounded-md bg-positive px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {completedPending ? "Saving…" : "Log Completed Cases"}
          </button>
        </form>
      ) : (
        <form key="rework" action={reworkAction} className="space-y-3">
          <input type="hidden" name="batchId" value={reworkBatchId} />
          <EmployeeSelect employees={employees} />
          <CasesInput />
          <div>
            <label className="block text-sm font-medium text-foreground">Responsibility</label>
            <select
              name="responsibility"
              required
              defaultValue="DEPARTMENT_FAULT"
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="DEPARTMENT_FAULT">Department-caused (deducts from score)</option>
              <option value="EXTERNAL_NOT_FAULT">
                External / not the department&apos;s fault (logged only, no deduction)
              </option>
            </select>
          </div>
          <DateInput />
          <ReasonInput placeholder="e.g. Margin chipped during finishing" />
          <FormError message={reworkState.error} />
          <button
            type="submit"
            disabled={reworkPending}
            className="w-full rounded-md bg-negative px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {reworkPending ? "Saving…" : "Log Returned Case"}
          </button>
        </form>
      )}
    </Card>
  );
}

function EmployeeSelect({ employees }: { employees: { id: string; label: string }[] }) {
  return (
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
  );
}

function CasesInput() {
  return (
    <div>
      <label htmlFor="cases" className="block text-sm font-medium text-foreground">
        Number of cases
      </label>
      <input
        id="cases"
        name="cases"
        type="number"
        min={1}
        step={1}
        required
        defaultValue={1}
        className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
      />
    </div>
  );
}

function DateInput() {
  return (
    <div>
      <label htmlFor="eventDate" className="block text-sm font-medium text-foreground">
        Date
      </label>
      <input
        id="eventDate"
        name="eventDate"
        type="date"
        required
        defaultValue={todayIso()}
        className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
      />
    </div>
  );
}

function ReasonInput({ placeholder }: { placeholder: string }) {
  return (
    <div>
      <label htmlFor="reason" className="block text-sm font-medium text-foreground">
        Note
      </label>
      <input
        id="reason"
        name="reason"
        required
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
      />
    </div>
  );
}
