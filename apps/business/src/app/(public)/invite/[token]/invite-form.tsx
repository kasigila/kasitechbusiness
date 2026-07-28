"use client";

import { useActionState } from "react";
import { Button } from "@kasitech/ui";
import {
  acceptInvitationAction,
  type InviteActionState,
} from "./actions";

const initial: InviteActionState = {};

export function InviteAcceptForm({
  token,
  email,
  businessName,
}: {
  token: string;
  email: string;
  businessName: string;
}) {
  const [state, action, pending] = useActionState(acceptInvitationAction, initial);

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-[var(--kb-muted)]">
        You&apos;re joining <strong>{businessName}</strong> as{" "}
        <strong>{email}</strong>.
      </p>
      <label className="block">
        <span className="kb-label">Full name</span>
        <input
          name="fullName"
          className="kb-input mt-1"
          autoComplete="name"
          required
          minLength={2}
        />
      </label>
      <label className="block">
        <span className="kb-label">Create password</span>
        <input
          name="password"
          type="password"
          className="kb-input mt-1"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </label>
      {state.error ? (
        <p className="text-sm text-[var(--kb-danger)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" loading={pending} className="w-full">
        Accept invitation
      </Button>
    </form>
  );
}
