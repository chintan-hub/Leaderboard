"use client";

import { useActionState } from "react";
import { updateEmployee } from "@/lib/actions/employees";
import { FormError } from "@/components/ui";

export default function EditEmployeeForm({
  employee,
  departments,
}: {
  employee: { id: string; name: string; departmentId: string };
  departments: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateEmployee, {});

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2 rounded-md bg-background p-3">
      <input type="hidden" name="id" value={employee.id} />
      <div>
        <label className="block text-xs font-medium text-muted">Name</label>
        <input
          name="name"
          required
          minLength={2}
          defaultValue={employee.name}
          className="mt-1 rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted">Department</label>
        <select
          name="departmentId"
          defaultValue={employee.departmentId}
          className="mt-1 rounded-md border border-border px-2 py-1.5 text-sm"
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      <FormError message={state.error} />
    </form>
  );
}
