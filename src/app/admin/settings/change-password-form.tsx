"use client";

import { useActionState } from "react";
import { changeAdminPassword } from "@/lib/actions/settings";
import { Card, FormError } from "@/components/ui";

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeAdminPassword, {});

  return (
    <Card>
      <form action={formAction} className="space-y-3">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <FormError message={state.error} />
        {state.success && (
          <p className="rounded-md bg-positive-tint px-3 py-2 text-sm font-medium text-positive">
            Password updated.
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
        >
          {pending ? "Saving…" : "Update Password"}
        </button>
      </form>
    </Card>
  );
}
