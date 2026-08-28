"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/lib/actions/auth";
import { Card, Field, FormError, PrimaryButton, SectionTitle, TextInput } from "@/components/ui";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAdmin, {});

  return (
    <div className="mx-auto max-w-sm">
      <SectionTitle subtitle="The rest of the app is view-only and needs no login.">
        Admin Login
      </SectionTitle>
      <Card raised>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Username" htmlFor="username">
            <TextInput id="username" name="username" required autoFocus />
          </Field>
          <Field label="Password" htmlFor="password">
            <TextInput id="password" name="password" type="password" required />
          </Field>
          <FormError message={state.error} />
          <PrimaryButton type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in…" : "Sign in"}
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
