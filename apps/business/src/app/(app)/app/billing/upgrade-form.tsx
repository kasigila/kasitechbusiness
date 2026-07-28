"use client";

import { useActionState } from "react";
import { Button } from "@kasitech/ui";
import {
  createUpgradeRequestAction,
  type UpgradeActionState,
} from "./actions";

const initial: UpgradeActionState = {};

export function UpgradeRequestForm({
  requestType,
  targetPlanKey,
  targetAddonKey,
  featureKey,
  label,
}: {
  requestType: "UPGRADE_PLAN" | "ADDON" | "LIMIT_INCREASE";
  targetPlanKey?: string;
  targetAddonKey?: string;
  featureKey?: string;
  label: string;
}) {
  const [state, action, pending] = useActionState(
    createUpgradeRequestAction,
    initial,
  );

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="requestType" value={requestType} />
      {targetPlanKey ? (
        <input type="hidden" name="targetPlanKey" value={targetPlanKey} />
      ) : null}
      {targetAddonKey ? (
        <input type="hidden" name="targetAddonKey" value={targetAddonKey} />
      ) : null}
      {featureKey ? (
        <input type="hidden" name="featureKey" value={featureKey} />
      ) : null}
      <Button type="submit" variant="secondary" loading={pending}>
        {label}
      </Button>
      {state.error ? (
        <p className="kb-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-[var(--kb-success)]" role="status">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
