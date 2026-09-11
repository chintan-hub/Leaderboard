"use client";

import { useActionState } from "react";
import { updateDepartment } from "@/lib/actions/departments";
import { Field, FormError, PrimaryButton, TextInput } from "@/components/ui";

interface DepartmentSettings {
  id: string;
  name: string;
}

export default function EditDepartmentForm({ department }: { department: DepartmentSettings }) {
  const [state, formAction, pending] = useActionState(updateDepartment, {});

  return (
    <form action={formAction} className="space-y-4 border-t border-border pt-4">
      <input type="hidden" name="id" value={department.id} />

      <Field label="Department name" htmlFor={`name-${department.id}`}>
        <TextInput id={`name-${department.id}`} name="name" required minLength={2} defaultValue={department.name} />
      </Field>

      <FormError message={state.error} />

      <PrimaryButton type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Name"}
      </PrimaryButton>
    </form>
  );
}
