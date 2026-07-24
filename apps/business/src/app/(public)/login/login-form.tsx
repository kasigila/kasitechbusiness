"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Field, Input } from "@kasitech/ui";
import { signInAction, type AuthActionState } from "../actions";

const initial: AuthActionState = {};

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(signInAction, initial);

  return (
    <form action={action} className="grid gap-4">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      <Field label="Email" htmlFor="email" error={undefined}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@business.co.tz"
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </Field>

      {state.error ? (
        <p className="kb-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" loading={pending} className="w-full">
        Sign In
      </Button>

      <p className="text-center text-sm text-[var(--kb-muted)]">
        <Link href="/forgot-password" className="underline-offset-4 hover:underline">
          Forgot Password
        </Link>
      </p>
    </form>
  );
}
