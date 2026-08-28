"use client";

import { useActionState } from "react";
import { createEmployee } from "@/lib/actions/employees";
import { Card, Field, FormError, PrimaryButton, Select, TextInput } from "@/components/ui";

export default function NewEmployeeForm({
  departments,
}: {
  departments: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createEmployee, {});

  return (
    <Card>
      <form action={formAction} className="space-y-4">
        <Field label="Employee name" htmlFor="name">
          <TextInput id="name" name="name" required minLength={2} />
        </Field>
        <Field label="Department" htmlFor="departmentId">
          <Select id="departmentId" name="departmentId" required>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
        <FormError message={state.error} />
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add Employee"}
        </PrimaryButton>
      </form>
    </Card>
  );
}
