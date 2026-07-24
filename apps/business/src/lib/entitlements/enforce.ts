import {
  checkLimit,
  type EffectiveEntitlements,
} from "@kasitech/entitlements";
import { suggestUpgrade } from "@kasitech/entitlements";
import type { Result } from "@kasitech/validation";

/**
 * Enforce seat limits before inviting or activating memberships.
 * Call from server actions — never rely on disabled UI alone.
 */
export function assertSeatAvailable(input: {
  entitlements: EffectiveEntitlements;
  activeSeatCount: number;
}): Result<true> {
  const suggestion = suggestUpgrade("max_users", input.entitlements.planKey);
  return checkLimit({
    entitlements: input.entitlements,
    featureKey: "max_users",
    usage: input.activeSeatCount,
    suggestedAddonKey: suggestion.addonKey,
    suggestedPlanKey: suggestion.planKey,
  });
}

export function assertLocationAvailable(input: {
  entitlements: EffectiveEntitlements;
  activeLocationCount: number;
}): Result<true> {
  const suggestion = suggestUpgrade(
    "max_locations",
    input.entitlements.planKey,
  );
  return checkLimit({
    entitlements: input.entitlements,
    featureKey: "max_locations",
    usage: input.activeLocationCount,
    suggestedAddonKey: suggestion.addonKey,
    suggestedPlanKey: suggestion.planKey,
  });
}
