"use client";

import { useActionState, useState } from "react";
import { deleteDepartment } from "@/lib/actions/departments";
import { FormError } from "@/components/ui";
import { IconTrash } from "@/components/icons";

export default function DeleteDepartmentButton({ departmentId, departmentName }: { departmentId: string; departmentName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteDepartment, {});

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-negative transition hover:bg-negative-tint"
      >
        <IconTrash className="h-3.5 w-3.5" />
        Delete
      </button>
    );
  }

  return (
    <div className="w-full space-y-2 rounded-lg border border-negative/30 bg-negative-tint/40 p-2.5">
      <p className="text-xs font-semibold text-foreground">Delete {departmentName} permanently?</p>
      <FormError message={state.error} />
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={departmentId} />
        <button
          type="submit"
          disabled={pending}
          className="focus-ring rounded-lg bg-negative px-2.5 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Confirm delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="focus-ring rounded-lg px-2.5 py-1 text-xs font-semibold text-muted transition hover:text-foreground"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
