"use client";

import { useActionState } from "react";
import { setDepartmentActive } from "@/lib/actions/departments";
import { IconArchive } from "@/components/icons";

export default function ArchiveDepartmentButton({
  departmentId,
  isActive,
}: {
  departmentId: string;
  isActive: boolean;
}) {
  const [, formAction, pending] = useActionState(setDepartmentActive, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={departmentId} />
      <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
      <button
        type="submit"
        disabled={pending}
        className={`focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition disabled:opacity-50 ${
          isActive ? "text-muted hover:bg-silver-tint hover:text-foreground" : "text-positive hover:bg-positive-tint"
        }`}
      >
        <IconArchive className="h-3.5 w-3.5" />
        {pending ? "…" : isActive ? "Archive" : "Reactivate"}
      </button>
    </form>
  );
}
