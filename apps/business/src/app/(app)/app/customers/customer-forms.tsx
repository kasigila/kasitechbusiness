"use client";

import { useActionState } from "react";
import { Button } from "@kasitech/ui";
import { upsertCustomerAction } from "./actions";
import type { ActionMessage } from "@/lib/actions/result";

const initial: ActionMessage | null = null;

export function CustomerForms() {
  const [state, action, pending] = useActionState(upsertCustomerAction, initial);
  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4 sm:grid-cols-3">
      <input name="fullName" className="kb-input" placeholder="Full name" required />
      <input name="phone" className="kb-input" placeholder="Phone / WhatsApp" />
      <input name="email" type="email" className="kb-input" placeholder="Email" />
      <Button type="submit" loading={pending} className="sm:col-span-3 sm:w-fit">
        Add guest
      </Button>
      {state ? (
        <p className={`sm:col-span-3 text-sm ${state.ok ? "text-[var(--kb-success)]" : "text-[var(--kb-danger)]"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
