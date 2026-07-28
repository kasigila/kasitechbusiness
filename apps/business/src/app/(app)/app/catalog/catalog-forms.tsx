"use client";

import { useActionState } from "react";
import { Button } from "@kasitech/ui";
import { upsertCatalogItemAction } from "./actions";
import type { ActionMessage } from "@/lib/actions/result";

const initial: ActionMessage | null = null;

export function CatalogForms() {
  const [state, action, pending] = useActionState(upsertCatalogItemAction, initial);

  return (
    <form
      action={action}
      className="grid gap-3 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4 sm:grid-cols-4"
    >
      <input name="name" className="kb-input" placeholder="Item name" required />
      <input name="category" className="kb-input" placeholder="Category" defaultValue="Mains" />
      <input
        name="priceMinor"
        type="number"
        min={0}
        className="kb-input"
        placeholder="Price (TZS)"
        required
      />
      <Button type="submit" loading={pending}>
        Add item
      </Button>
      {state ? (
        <p
          className={`sm:col-span-4 text-sm ${state.ok ? "text-[var(--kb-success)]" : "text-[var(--kb-danger)]"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
