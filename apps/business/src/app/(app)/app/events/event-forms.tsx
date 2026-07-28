"use client";

import { useActionState } from "react";
import { Button } from "@kasitech/ui";
import { upsertEventAction } from "./actions";
import type { ActionMessage } from "@/lib/actions/result";

const initial: ActionMessage | null = null;

export function EventForms() {
  const [state, action, pending] = useActionState(upsertEventAction, initial);
  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4 sm:grid-cols-3">
      <input name="name" className="kb-input" placeholder="Event name" required />
      <input name="startsAt" type="datetime-local" className="kb-input" required />
      <input name="priceMinor" type="number" min={0} className="kb-input" placeholder="Price TZS" defaultValue={0} />
      <input type="hidden" name="status" value="DRAFT" />
      <Button type="submit" loading={pending} className="sm:col-span-3 sm:w-fit">
        Add event
      </Button>
      {state ? (
        <p className={`sm:col-span-3 text-sm ${state.ok ? "text-[var(--kb-success)]" : "text-[var(--kb-danger)]"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
