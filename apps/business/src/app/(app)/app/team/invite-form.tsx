"use client";

import { useActionState } from "react";
import { Button } from "@kasitech/ui";
import { inviteTeamMemberAction } from "./actions";
import type { ActionMessage } from "@/lib/actions/result";

const initial: ActionMessage | null = null;

export function InviteForm({ disabled }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState(inviteTeamMemberAction, initial);

  if (disabled) return null;

  return (
    <form action={action} className="mb-6 grid gap-3 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4 sm:grid-cols-3">
      <input name="email" type="email" className="kb-input" placeholder="Email" required />
      <select name="roleKey" className="kb-input" defaultValue="STAFF">
        <option value="MANAGER">Manager</option>
        <option value="STAFF">Staff</option>
        <option value="VIEWER">Viewer</option>
      </select>
      <Button type="submit" loading={pending}>
        Send invite
      </Button>
      {state ? (
        <p className={`sm:col-span-3 text-sm ${state.ok ? "text-[var(--kb-success)]" : "text-[var(--kb-danger)]"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
