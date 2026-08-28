"use client";

import { useActionState } from "react";
import { updateEmployee } from "@/lib/actions/employees";
import { FormError, PrimaryButton } from "@/components/ui";

export default function EditEmployeeForm({
  employee,
  departments,
}: {
  employee: { id: string; name: string; departmentId: string };
  departments: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateEmployee, {});

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-background p-3"
    >
      <input type="hidden" name="id" value={employee.id} />
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Name</label>
        <input
          name="name"
          required
          minLength={2}
          defaultValue={employee.name}
          className="focus-ring rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Department</label>
        <select
          name="departmentId"
          defaultValue={employee.departmentId}
          className="focus-ring rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm"
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <PrimaryButton type="submit" disabled={pending} className="px-3 py-1.5">
        {pending ? "Saving…" : "Save"}
      </PrimaryButton>
      <FormError message={state.error} />
    </form>
  );
}
