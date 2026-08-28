"use client";

import { useActionState } from "react";
import { changeAdminPassword } from "@/lib/actions/settings";
import { Card, Field, FormError, FormSuccess, PrimaryButton, TextInput } from "@/components/ui";

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeAdminPassword, {});

  return (
    <Card>
      <form action={formAction} className="space-y-4">
        <Field label="Current password" htmlFor="currentPassword">
          <TextInput id="currentPassword" name="currentPassword" type="password" required />
        </Field>
        <Field label="New password" htmlFor="newPassword">
          <TextInput id="newPassword" name="newPassword" type="password" required minLength={8} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword">
          <TextInput id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
        </Field>
        <FormError message={state.error} />
        {state.success && <FormSuccess message="Password updated." />}
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Saving…" : "Update Password"}
        </PrimaryButton>
      </form>
    </Card>
  );
}
