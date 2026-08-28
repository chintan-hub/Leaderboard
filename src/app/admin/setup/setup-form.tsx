"use client";

import { useActionState } from "react";
import { setupFirstAdmin } from "@/lib/actions/auth";
import { Card, Field, FormError, PrimaryButton, SectionTitle, TextInput } from "@/components/ui";

export default function SetupForm() {
  const [state, formAction, pending] = useActionState(setupFirstAdmin, {});

  return (
    <div className="mx-auto max-w-sm">
      <SectionTitle subtitle="This is the one and only admin account for the lab. Everyone else uses the app view-only, with no login.">
        Create the Admin Account
      </SectionTitle>
      <Card raised>
        <form action={formAction} className="space-y-4">
          <Field label="Username" htmlFor="username">
            <TextInput id="username" name="username" required minLength={3} autoFocus />
          </Field>
          <Field label="Password" htmlFor="password">
            <TextInput id="password" name="password" type="password" required minLength={8} />
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword">
            <TextInput id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
          </Field>
          <FormError message={state.error} />
          <PrimaryButton type="submit" disabled={pending} className="w-full">
            {pending ? "Creating…" : "Create Admin Account"}
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
