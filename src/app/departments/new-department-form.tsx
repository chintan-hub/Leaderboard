"use client";

import { useActionState } from "react";
import { createDepartment } from "@/lib/actions/departments";
import { Card, FormError } from "@/components/ui";

export default function NewDepartmentForm() {
  const [state, formAction, pending] = useActionState(createDepartment, {});

  return (
    <Card>
      <form action={formAction} className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Department name
          </label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            placeholder="e.g. Packing"
          />
        </div>
        <FormError message={state.error} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add Department"}
        </button>
      </form>
    </Card>
  );
}
