"use client";

import { useActionState } from "react";
import { createDepartment } from "@/lib/actions/departments";
import { Card, Field, FormError, PrimaryButton, TextInput } from "@/components/ui";
import { IconPlus } from "@/components/icons";

export default function NewDepartmentForm() {
  const [state, formAction, pending] = useActionState(createDepartment, {});

  return (
    <Card>
      <form action={formAction} className="space-y-4">
        <Field label="Department name" htmlFor="name">
          <TextInput id="name" name="name" required minLength={2} placeholder="e.g. Packing" />
        </Field>
        <FormError message={state.error} />
        <PrimaryButton type="submit" disabled={pending}>
          <IconPlus className="h-4 w-4" />
          {pending ? "Adding…" : "Add Department"}
        </PrimaryButton>
      </form>
    </Card>
  );
}
