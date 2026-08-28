"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { saveBulkProduction, type BulkProductionResultState } from "@/lib/actions/production";
import { Card, FormError, MovementIndicator } from "@/components/ui";
import type { DailyProductionTotals } from "@/lib/scoring/daily";

interface ReasonOption {
  label: string;
  responsibility: "DEPARTMENT_FAULT" | "EXTERNAL_NOT_FAULT";
}

interface RowState {
  completed: string;
  rework: string;
  reasonIndex: string; // index into reasonOptions, as a string select value
}

interface DailyStatus {
  hasEntry: boolean;
  casesCompleted: number;
  casesReturned: number;
  casesReturnedExternal: number;
  net: number;
}

function emptyRow(): RowState {
  return { completed: "", rework: "", reasonIndex: "" };
}

function newBatchId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function netFor(row: RowState, reasonOptions: ReasonOption[]): number {
  const completed = Number(row.completed) || 0;
  const rework = Number(row.rework) || 0;
  const reason = reasonOptions[Number(row.reasonIndex)];
  const chargeable = rework > 0 && reason?.responsibility === "DEPARTMENT_FAULT" ? rework : 0;
  return completed - chargeable;
}

function boardDateLabel(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00Z`)
    .toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .toUpperCase();
}

export default function BulkProductionForm({
  department,
  date,
  employees,
  reasonOptions,
  existingSummary,
  dailyStatus,
  comparison,
}: {
  department: { id: string; name: string; reworkTrackingEnabled: boolean };
  date: string;
  employees: { id: string; name: string }[];
  reasonOptions: ReasonOption[];
  existingSummary: { completed: number; rework: number; employeeCount: number; entryCount: number } | null;
  dailyStatus: Record<string, DailyStatus>;
  comparison: { today: DailyProductionTotals; yesterday: DailyProductionTotals };
}) {
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(employees.map((e) => [e.id, emptyRow()])),
  );
  const [batchId, setBatchId] = useState(newBatchId);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<BulkProductionResultState>({});

  const totals = useMemo(() => {
    let completed = 0;
    let net = 0;
    for (const emp of employees) {
      const row = rows[emp.id];
      if (!row) continue;
      completed += Number(row.completed) || 0;
      net += netFor(row, reasonOptions);
    }
    return { completed, net };
  }, [rows, employees, reasonOptions]);

  const recordedCount = employees.filter((e) => dailyStatus[e.id]?.hasEntry).length;
  const netDelta = comparison.today.net - comparison.yesterday.net;

  function updateRow(employeeId: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [employeeId]: { ...prev[employeeId], ...patch } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setResult({});

    const payload = {
      departmentId: department.id,
      eventDate: date,
      batchId,
      completedNote: note,
      rows: employees.map((emp) => {
        const row = rows[emp.id] ?? emptyRow();
        const reason = reasonOptions[Number(row.reasonIndex)];
        const rework = Number(row.rework) || 0;
        return {
          employeeId: emp.id,
          completed: Number(row.completed) || 0,
          rework,
          reworkResponsibility: rework > 0 ? reason?.responsibility : undefined,
          reworkReason: rework > 0 ? reason?.label : undefined,
        };
      }),
    };

    const outcome = await saveBulkProduction(payload);
    setSaving(false);
    setResult(outcome);

    if (!outcome.error) {
      setRows(Object.fromEntries(employees.map((e) => [e.id, emptyRow()])));
      setNote("");
      setBatchId(newBatchId());
    }
  }

  if (employees.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          No active employees in {department.name} yet. Add one on the{" "}
          <Link href="/employees" className="font-semibold underline">
            Employees
          </Link>{" "}
          page first.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="p-0" raised>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-foreground">{department.name}</h3>
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">{boardDateLabel(date)}</p>
          </div>
          <span className="rounded-full bg-silver-tint px-3 py-1 text-xs font-bold text-muted">
            {recordedCount} of {employees.length} recorded today
          </span>
        </div>

        {existingSummary && existingSummary.entryCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-info/30 bg-info-tint px-5 py-2.5 text-sm text-info">
            <span>
              Already recorded for {department.name} on this date: {existingSummary.completed} completed,{" "}
              {existingSummary.rework} rework across {existingSummary.employeeCount}{" "}
              {existingSummary.employeeCount === 1 ? "employee" : "employees"}. Saving below adds more — it
              won&apos;t overwrite anything.
            </span>
            <Link
              href={`/activity?departmentId=${department.id}&date=${date}`}
              className="focus-ring whitespace-nowrap rounded font-semibold underline"
            >
              View entries
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border-strong text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="w-28 px-3 py-3">Completed</th>
                  {department.reworkTrackingEnabled && <th className="w-28 px-3 py-3">Returned</th>}
                  {department.reworkTrackingEnabled && <th className="px-3 py-3">Return reason</th>}
                  <th className="w-24 px-5 py-3 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((emp) => {
                  const row = rows[emp.id] ?? emptyRow();
                  const rework = Number(row.rework) || 0;
                  const status = dailyStatus[emp.id];
                  return (
                    <tr key={emp.id} className="transition-colors hover:bg-surface-hover">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className={`text-sm ${status?.hasEntry ? "text-positive" : "text-muted/50"}`}
                            title={status?.hasEntry ? "Recorded today" : "Not recorded yet"}
                          >
                            {status?.hasEntry ? "✓" : "○"}
                          </span>
                          <span className="font-semibold text-foreground">{emp.name}</span>
                        </div>
                        {status?.hasEntry && (
                          <p className="mt-0.5 pl-5 text-xs text-muted">
                            Already recorded: {status.casesCompleted} completed
                            {status.casesReturned > 0 ? `, ${status.casesReturned} returned` : ""} ·{" "}
                            <Link
                              href={`/activity?departmentId=${department.id}&date=${date}&employeeId=${emp.id}`}
                              className="focus-ring rounded font-semibold text-brand underline"
                            >
                              Edit today&apos;s entry
                            </Link>
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          value={row.completed}
                          onChange={(e) => updateRow(emp.id, { completed: e.target.value })}
                          placeholder="0"
                          className="focus-ring w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-right tabular-nums"
                        />
                      </td>
                      {department.reworkTrackingEnabled && (
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            step={1}
                            value={row.rework}
                            onChange={(e) => updateRow(emp.id, { rework: e.target.value })}
                            placeholder="0"
                            className="focus-ring w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-right tabular-nums"
                          />
                        </td>
                      )}
                      {department.reworkTrackingEnabled && (
                        <td className="px-3 py-2.5">
                          {rework > 0 ? (
                            <select
                              value={row.reasonIndex}
                              required
                              onChange={(e) => updateRow(emp.id, { reasonIndex: e.target.value })}
                              className="focus-ring w-full min-w-[220px] rounded-lg border border-border bg-surface px-2 py-1.5"
                            >
                              <option value="" disabled>
                                Select a reason…
                              </option>
                              {reasonOptions.map((opt, i) => (
                                <option key={opt.label} value={i}>
                                  {opt.label}
                                  {opt.responsibility === "EXTERNAL_NOT_FAULT" ? " (not charged)" : ""}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-muted/40">—</span>
                          )}
                        </td>
                      )}
                      <td
                        className={`px-5 py-2.5 text-right font-bold tabular-nums ${
                          netFor(row, reasonOptions) < 0 ? "text-negative" : "text-foreground"
                        }`}
                      >
                        {netFor(row, reasonOptions)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-border-strong text-sm font-bold">
                <tr>
                  <td className="px-5 py-3">Total</td>
                  <td className="px-3 py-3 tabular-nums">{totals.completed}</td>
                  {department.reworkTrackingEnabled && <td />}
                  {department.reworkTrackingEnabled && <td />}
                  <td className="px-5 py-3 text-right tabular-nums text-foreground">{totals.net}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="space-y-3 border-t border-border px-5 py-4">
            <div>
              <label htmlFor="note" className="block text-sm font-semibold text-foreground">
                Note (optional — applies to completed cases entered above)
              </label>
              <input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Daily production entry"
                className="focus-ring mt-1.5 w-full max-w-md rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
              />
            </div>

            <FormError message={result.error} />
            {result.success && !result.error && (
              <p className="rounded-lg border border-positive/20 bg-positive-tint px-3 py-2 text-sm font-medium text-positive">
                {result.created && result.created > 0
                  ? `Saved. ${result.created} entr${result.created === 1 ? "y" : "ies"} recorded.`
                  : "Already saved — nothing new to add."}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="focus-ring rounded-lg bg-positive px-5 py-2.5 text-sm font-semibold text-white shadow-surface transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
            >
              {saving ? "Saving…" : `Save ${department.name} — ${date}`}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">Today&apos;s Department Summary</p>
        <div className="mt-2.5 flex flex-wrap items-end justify-between gap-4">
          <div className="flex gap-6">
            <div>
              <div className="score-md text-xl text-foreground">{comparison.today.casesCompleted}</div>
              <div className="text-[10px] font-bold uppercase text-muted">Completed</div>
            </div>
            <div>
              <div
                className={`score-md text-xl ${comparison.today.casesReturned > 0 ? "text-negative" : "text-foreground"}`}
              >
                {comparison.today.casesReturned}
              </div>
              <div className="text-[10px] font-bold uppercase text-muted">Returned</div>
            </div>
            <div>
              <div className="score-md text-xl text-positive">{comparison.today.net}</div>
              <div className="text-[10px] font-bold uppercase text-muted">Net Cases</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>Yesterday: {comparison.yesterday.net} net</span>
            <span>→</span>
            <span className="font-semibold text-foreground">Today: {comparison.today.net} net</span>
            <MovementIndicator delta={netDelta} />
          </div>
        </div>
      </Card>
    </div>
  );
}
