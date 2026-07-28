"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Field, Input } from "@kasitech/ui";
import {
  requestPasswordResetAction,
  type AuthActionState,
} from "../actions";

const initial: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    initial,
  );

  return (
    <form action={action} className="grid gap-4">
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@business.co.tz"
        />
      </Field>

      {state.error ? (
        <p className="kb-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-[var(--kb-success)]" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" loading={pending} className="w-full">
        Send reset link
      </Button>

      <p className="text-center text-sm text-[var(--kb-muted)]">
        <Link href="/login" className="underline-offset-4 hover:underline">
          Back to Sign In
        </Link>
      </p>
    </form>
  );
}
