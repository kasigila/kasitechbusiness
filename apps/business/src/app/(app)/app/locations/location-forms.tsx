"use client";

import { useActionState } from "react";
import { Button } from "@kasitech/ui";
import { createLocationAction } from "./actions";
import type { ActionMessage } from "@/lib/actions/result";

const initial: ActionMessage | null = null;

export function LocationForms() {
  const [state, action, pending] = useActionState(createLocationAction, initial);
  return (
    <form action={action} className="mb-6 grid gap-3 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4 sm:grid-cols-3">
      <input name="name" className="kb-input" placeholder="Location name" required />
      <input name="address" className="kb-input sm:col-span-2" placeholder="Address" />
      <Button type="submit" loading={pending} className="sm:col-span-3 sm:w-fit">
        Add location
      </Button>
      {state ? (
        <p className={`sm:col-span-3 text-sm ${state.ok ? "text-[var(--kb-success)]" : "text-[var(--kb-danger)]"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
