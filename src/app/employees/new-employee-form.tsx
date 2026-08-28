"use client";

import { useActionState } from "react";
import { createEmployee } from "@/lib/actions/employees";
import { Card, FormError } from "@/components/ui";

export default function NewEmployeeForm({
  departments,
}: {
  departments: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createEmployee, {});

  return (
    <Card>
      <form action={formAction} className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Employee name
          </label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="departmentId" className="block text-sm font-medium text-foreground">
            Department
          </label>
          <select
            id="departmentId"
            name="departmentId"
            required
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <FormError message={state.error} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add Employee"}
        </button>
      </form>
    </Card>
  );
}
