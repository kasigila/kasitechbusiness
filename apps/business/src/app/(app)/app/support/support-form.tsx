"use client";

import { useActionState } from "react";
import { Button } from "@kasitech/ui";
import { submitSupportTicketAction } from "./actions";
import type { ActionMessage } from "@/lib/actions/result";

const initial: ActionMessage | null = null;

export function SupportForm() {
  const [state, action, pending] = useActionState(submitSupportTicketAction, initial);

  return (
    <form action={action} className="mt-4 space-y-3">
      <label className="block">
        <span className="kb-label">Subject</span>
        <input name="subject" className="kb-input mt-1" placeholder="Brief summary" required />
      </label>
      <label className="block">
        <span className="kb-label">Details</span>
        <textarea
          name="body"
          rows={4}
          className="kb-input mt-1"
          placeholder="What happened? What did you expect?"
          required
        />
      </label>
      <Button type="submit" loading={pending}>
        Submit ticket
      </Button>
      {state ? (
        <p className={`text-sm ${state.ok ? "text-[var(--kb-success)]" : "text-[var(--kb-danger)]"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
