"use client";

import { useRouter } from "next/navigation";

function isToday(dateIso: string): boolean {
  return dateIso === new Date().toISOString().slice(0, 10);
}

function dateLabel(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function DepartmentDatePicker({
  departments,
  selectedDepartmentId,
  date,
}: {
  departments: { id: string; name: string }[];
  selectedDepartmentId: string | null;
  date: string;
}) {
  const router = useRouter();

  function goTo(nextDepartmentId: string | null, nextDate: string) {
    const params = new URLSearchParams();
    if (nextDepartmentId) params.set("department", nextDepartmentId);
    params.set("date", nextDate);
    router.push(`/admin/production?${params.toString()}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand">
            {isToday(date) ? "Today" : "Date"}
          </p>
          <p className="text-lg font-extrabold text-foreground">{dateLabel(date)}</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => goTo(selectedDepartmentId, e.target.value)}
          aria-label="Change date"
          className="focus-ring rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground"
        />
        {!isToday(date) && (
          <button
            type="button"
            onClick={() => goTo(selectedDepartmentId, new Date().toISOString().slice(0, 10))}
            className="focus-ring rounded-lg px-2 py-1 text-sm font-semibold text-brand hover:underline"
          >
            Jump to today
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Select Department</p>
        <div className="flex flex-wrap gap-2">
          {departments.map((dept) => (
            <button
              key={dept.id}
              type="button"
              onClick={() => goTo(dept.id, date)}
              className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold transition ${
                dept.id === selectedDepartmentId
                  ? "bg-brand text-white shadow-surface"
                  : "border border-border bg-surface text-muted hover:border-border-strong hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
