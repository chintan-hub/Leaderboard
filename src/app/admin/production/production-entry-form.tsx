"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { recordProductionCompleted, recordProductionRework } from "@/lib/actions/production";
import { Card, Field, FormError, Select, TextInput } from "@/components/ui";

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
    <Card raised className="max-w-lg">
      <div className="mb-4 flex gap-1 rounded-lg bg-silver-tint p-1">
        <button
          type="button"
          onClick={() => setMode("COMPLETED")}
          className={`focus-ring flex-1 rounded-md py-2 text-sm font-semibold transition ${
            mode === "COMPLETED" ? "bg-white text-positive shadow-surface" : "text-muted hover:text-foreground"
          }`}
        >
          + Completed
        </button>
        <button
          type="button"
          onClick={() => setMode("REWORK")}
          className={`focus-ring flex-1 rounded-md py-2 text-sm font-semibold transition ${
            mode === "REWORK" ? "bg-white text-negative shadow-surface" : "text-muted hover:text-foreground"
          }`}
        >
          − Returned
        </button>
      </div>

      {mode === "COMPLETED" ? (
        <form key="completed" action={completedAction} className="space-y-4">
          <input type="hidden" name="batchId" value={completedBatchId} />
          <EmployeeSelect employees={employees} />
          <CasesInput />
          <DateInput />
          <ReasonInput placeholder="e.g. Case #4821 delivered on time" />
          <FormError message={completedState.error} />
          <button
            type="submit"
            disabled={completedPending}
            className="focus-ring w-full rounded-lg bg-positive px-4 py-2.5 text-sm font-semibold text-white shadow-surface transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
          >
            {completedPending ? "Saving…" : "Log Completed Cases"}
          </button>
        </form>
      ) : (
        <form key="rework" action={reworkAction} className="space-y-4">
          <input type="hidden" name="batchId" value={reworkBatchId} />
          <EmployeeSelect employees={employees} />
          <CasesInput />
          <Field label="Responsibility">
            <Select name="responsibility" required defaultValue="DEPARTMENT_FAULT">
              <option value="DEPARTMENT_FAULT">Department-caused (deducts from score)</option>
              <option value="EXTERNAL_NOT_FAULT">
                External / not the department&apos;s fault (logged only, no deduction)
              </option>
            </Select>
          </Field>
          <DateInput />
          <ReasonInput placeholder="e.g. Margin chipped during finishing" />
          <FormError message={reworkState.error} />
          <button
            type="submit"
            disabled={reworkPending}
            className="focus-ring w-full rounded-lg bg-negative px-4 py-2.5 text-sm font-semibold text-white shadow-surface transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
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
    <Field label="Employee" htmlFor="employeeId">
      <Select id="employeeId" name="employeeId" required>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function CasesInput() {
  return (
    <Field label="Number of cases" htmlFor="cases">
      <TextInput id="cases" name="cases" type="number" min={1} step={1} required defaultValue={1} />
    </Field>
  );
}

function DateInput() {
  return (
    <Field label="Date" htmlFor="eventDate">
      <TextInput id="eventDate" name="eventDate" type="date" required defaultValue={todayIso()} />
    </Field>
  );
}

function ReasonInput({ placeholder }: { placeholder: string }) {
  return (
    <Field label="Note" htmlFor="reason">
      <TextInput id="reason" name="reason" required placeholder={placeholder} />
    </Field>
  );
}
