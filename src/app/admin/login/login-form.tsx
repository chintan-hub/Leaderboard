"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/lib/actions/auth";
import { Card, FormError, SectionTitle } from "@/components/ui";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAdmin, {});

  return (
    <div className="mx-auto max-w-sm">
      <SectionTitle subtitle="The rest of the app is view-only and needs no login.">
        Admin Login
      </SectionTitle>
      <Card>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground">
              Username
            </label>
            <input
              id="username"
              name="username"
              required
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
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
          <FormError message={state.error} />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </Card>
    </div>
  );
}
