"use client";

import { useActionState } from "react";
import { setEmployeeActive } from "@/lib/actions/employees";

export default function DeactivateButton({
  employeeId,
  isActive,
}: {
  employeeId: string;
  isActive: boolean;
}) {
  const [, formAction, pending] = useActionState(setEmployeeActive, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={employeeId} />
      <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-md px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${
          isActive
            ? "text-negative hover:bg-negative-tint"
            : "text-positive hover:bg-positive-tint"
        }`}
      >
        {pending ? "…" : isActive ? "Deactivate" : "Reactivate"}
      </button>
    </form>
  );
}
