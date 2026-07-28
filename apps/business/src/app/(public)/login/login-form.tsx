"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Field, Input } from "@kasitech/ui";
import { signInAction, type AuthActionState } from "../actions";
import { mockLoginAction } from "../mock-login-actions";

const initial: AuthActionState = {};

export function LoginForm({
  nextPath,
  showMockLogin,
}: {
  nextPath?: string;
  showMockLogin?: boolean;
}) {
  const [state, action, pending] = useActionState(signInAction, initial);

  return (
    <div className="grid gap-6">
      {showMockLogin ? (
        <div className="rounded-xl border border-dashed border-[var(--kb-border)] bg-[var(--kb-surface-2)]/60 p-4">
          <p className="text-sm font-medium text-[var(--kb-ink)]">
            Preview mock login
          </p>
          <p className="mt-1 text-sm text-[var(--kb-muted)]">
            No Supabase yet — use these to see exactly what a client or KasiTech
            staff member will see.
          </p>
          <div className="mt-4 grid gap-2">
            <form action={mockLoginAction}>
              <input type="hidden" name="persona" value="owner" />
              <input type="hidden" name="next" value={nextPath || "/app"} />
              <Button type="submit" className="w-full">
                Continue as demo customer
              </Button>
            </form>
            <form action={mockLoginAction}>
              <input type="hidden" name="persona" value="staff" />
              <input type="hidden" name="next" value="/command" />
              <Button type="submit" variant="secondary" className="w-full">
                Continue as KasiTech staff
              </Button>
            </form>
          </div>
        </div>
      ) : null}

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

        <Button type="submit" loading={pending} className="w-full" variant="secondary">
          Sign In
        </Button>

        <p className="text-center text-sm text-[var(--kb-muted)]">
          <Link href="/forgot-password" className="underline-offset-4 hover:underline">
            Forgot Password
          </Link>
        </p>
      </form>
    </div>
  );
}
