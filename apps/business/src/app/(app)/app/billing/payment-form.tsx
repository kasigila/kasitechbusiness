"use client";

import { useActionState } from "react";
import { Button } from "@kasitech/ui";
import { startPaymentAction } from "./payment-actions";
import type { ActionMessage } from "@/lib/actions/result";

const initial: ActionMessage | null = null;

export function PaymentStartForm({
  defaultAmountMinor = 150000,
}: {
  defaultAmountMinor?: number;
}) {
  const [state, action, pending] = useActionState(startPaymentAction, initial);

  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-3">
      <input
        name="amountMinor"
        type="number"
        min={1}
        defaultValue={defaultAmountMinor}
        className="kb-input"
        aria-label="Amount in TZS minor units"
      />
      <select name="provider" className="kb-input" defaultValue="manual">
        <option value="manual">Manual / bank</option>
        <option value="mpesa">M-Pesa</option>
        <option value="card">Card</option>
      </select>
      <Button type="submit" loading={pending}>
        Start payment
      </Button>
      {state ? (
        <p className={`sm:col-span-3 text-sm ${state.ok ? "text-[var(--kb-success)]" : "text-[var(--kb-danger)]"}`}>
          {state.message}
          {state.data?.checkoutUrl ? (
            <>
              {" "}
              <a className="underline" href={String(state.data.checkoutUrl)}>
                Open checkout
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </form>
  );
}
