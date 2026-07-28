"use client";

import { useActionState } from "react";
import { Button } from "@kasitech/ui";
import { createBookingAction } from "./actions";
import type { ActionMessage } from "@/lib/actions/result";

const initial: ActionMessage | null = null;

export function BookingForms() {
  const [state, action, pending] = useActionState(createBookingAction, initial);

  return (
    <form
      action={action}
      className="grid gap-3 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4 sm:grid-cols-4"
    >
      <input name="customerName" className="kb-input" placeholder="Guest name" required />
      <input name="customerPhone" className="kb-input" placeholder="Phone / WhatsApp" />
      <input
        name="startsAt"
        type="datetime-local"
        className="kb-input"
        required
      />
      <input name="partySize" type="number" min={1} defaultValue={2} className="kb-input" />
      <Button type="submit" loading={pending} className="sm:col-span-4 sm:w-fit">
        Add reservation
      </Button>
      {state ? (
        <p className={`sm:col-span-4 text-sm ${state.ok ? "text-[var(--kb-success)]" : "text-[var(--kb-danger)]"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
