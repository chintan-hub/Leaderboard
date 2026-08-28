"use client";

import { useActionState } from "react";
import { setupFirstAdmin } from "@/lib/actions/auth";
import { Card, FormError, SectionTitle } from "@/components/ui";

export default function SetupForm() {
  const [state, formAction, pending] = useActionState(setupFirstAdmin, {});

  return (
    <div className="mx-auto max-w-sm">
      <SectionTitle subtitle="This is the one and only admin account for the lab. Everyone else uses the app view-only, with no login.">
        Create the Admin Account
      </SectionTitle>
      <Card>
        <form action={formAction} className="space-y-3">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground">
              Username
            </label>
            <input
              id="username"
              name="username"
              required
              minLength={3}
              autoFocus
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm password
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
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
          >
            {pending ? "Creating…" : "Create Admin Account"}
          </button>
        </form>
      </Card>
    </div>
  );
}
