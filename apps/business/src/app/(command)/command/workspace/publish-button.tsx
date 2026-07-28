"use client";

import { useActionState } from "react";
import { Button } from "@kasitech/ui";
import { publishWorkspaceRecommendationAction } from "../workspace/actions";
import type { ActionMessage } from "@/lib/actions/result";

const initial: ActionMessage | null = null;

export function PublishWorkspaceButton({ businessId }: { businessId: string }) {
  const [state, action, pending] = useActionState(
    publishWorkspaceRecommendationAction,
    initial,
  );

  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="businessId" value={businessId} />
      <Button type="submit" loading={pending} variant="secondary">
        Publish workspace
      </Button>
      {state ? (
        <p className={`text-xs ${state.ok ? "text-emerald-300" : "text-rose-300"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
