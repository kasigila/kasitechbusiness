import {
  err,
  ok,
  platformError,
  type Result,
} from "@kasitech/validation";

export type FeatureValueType = "boolean" | "limit" | "enum";

export type EntitlementValue = {
  featureKey: string;
  valueType: FeatureValueType;
  /** Normalized string form from DB */
  raw: string;
};

export type EffectiveEntitlements = {
  businessId: string;
  planKey: string | null;
  planName: string | null;
  values: Map<string, string>;
  valueTypes: Map<string, FeatureValueType>;
};

export type LimitCheck = {
  featureKey: string;
  usage: number;
  limit: number;
  planName: string | null;
  suggestedAddonKey?: string;
  suggestedPlanKey?: string;
};

export type PlanEntitlementInput = {
  featureKey: string;
  value: string;
  valueType: FeatureValueType;
};

export type AddonEntitlementInput = {
  featureKey: string;
  value: string;
  valueType: FeatureValueType;
  mergeStrategy: "add" | "max" | "replace" | "enable";
  quantity: number;
};

export type OverrideInput = {
  featureKey: string;
  value: string;
  valueType: FeatureValueType;
  expiresAt?: string | null;
};

/**
 * Resolve effective entitlements:
 * BASE PLAN + ADD-ONS + AUTHORIZED OVERRIDES
 */
export function resolveEntitlements(input: {
  businessId: string;
  planKey: string | null;
  planName: string | null;
  planEntitlements: PlanEntitlementInput[];
  addonEntitlements?: AddonEntitlementInput[];
  overrides?: OverrideInput[];
  now?: Date;
}): EffectiveEntitlements {
  const values = new Map<string, string>();
  const valueTypes = new Map<string, FeatureValueType>();
  const now = input.now ?? new Date();

  for (const item of input.planEntitlements) {
    values.set(item.featureKey, item.value);
    valueTypes.set(item.featureKey, item.valueType);
  }

  for (const item of input.addonEntitlements ?? []) {
    valueTypes.set(item.featureKey, item.valueType);
    const current = values.get(item.featureKey);
    const qty = Math.max(1, item.quantity);

    switch (item.mergeStrategy) {
      case "add": {
        const base = Number(current ?? "0");
        const add = Number(item.value) * qty;
        values.set(item.featureKey, String(base + add));
        break;
      }
      case "max": {
        const base = Number(current ?? "0");
        const next = Number(item.value);
        values.set(item.featureKey, String(Math.max(base, next)));
        break;
      }
      case "replace":
        values.set(item.featureKey, item.value);
        break;
      case "enable":
        values.set(item.featureKey, "true");
        break;
    }
  }

  for (const item of input.overrides ?? []) {
    if (item.expiresAt && new Date(item.expiresAt) <= now) {
      continue;
    }
    values.set(item.featureKey, item.value);
    valueTypes.set(item.featureKey, item.valueType);
  }

  return {
    businessId: input.businessId,
    planKey: input.planKey,
    planName: input.planName,
    values,
    valueTypes,
  };
}

export function isFeatureEnabled(
  entitlements: EffectiveEntitlements,
  featureKey: string,
): boolean {
  const raw = entitlements.values.get(featureKey);
  if (raw == null) return false;
  return raw === "true" || raw === "1";
}

export function getLimit(
  entitlements: EffectiveEntitlements,
  featureKey: string,
): number {
  const raw = entitlements.values.get(featureKey);
  if (raw == null) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function checkLimit(input: {
  entitlements: EffectiveEntitlements;
  featureKey: string;
  usage: number;
  suggestedAddonKey?: string;
  suggestedPlanKey?: string;
}): Result<true> {
  const limit = getLimit(input.entitlements, input.featureKey);
  if (input.usage < limit) {
    return ok(true);
  }

  const details: LimitCheck = {
    featureKey: input.featureKey,
    usage: input.usage,
    limit,
    planName: input.entitlements.planName,
    suggestedAddonKey: input.suggestedAddonKey,
    suggestedPlanKey: input.suggestedPlanKey,
  };

  const planLabel = input.entitlements.planName ?? "current";
  const niceLimit =
    input.featureKey === "max_users"
      ? `${limit}-user`
      : input.featureKey === "max_locations"
        ? `${limit}-location`
        : `${limit}-unit`;

  return err(
    platformError(
      "PLAN_LIMIT_REACHED",
      `You've reached your ${planLabel} plan's ${niceLimit} limit.`,
      details,
    ),
  );
}

export function assertFeatureEnabled(
  entitlements: EffectiveEntitlements,
  featureKey: string,
): Result<true> {
  if (!isFeatureEnabled(entitlements, featureKey)) {
    return err(
      platformError(
        "FEATURE_NOT_AVAILABLE",
        `${humanizeFeature(featureKey)} is not included in your current plan.`,
        {
          featureKey,
          planName: entitlements.planName,
        },
      ),
    );
  }
  return ok(true);
}

export function formatTzs(amountMinor: number | null | undefined): string {
  if (amountMinor == null) return "Custom";
  return `TSh ${amountMinor.toLocaleString("en-TZ")}`;
}

export function humanizeFeature(featureKey: string): string {
  return featureKey.replaceAll("_", " ").replace("max ", "");
}

/** Suggested upgrade path when a limit is hit. */
export function suggestUpgrade(featureKey: string, planKey: string | null): {
  addonKey?: string;
  planKey?: string;
} {
  if (featureKey === "max_users") {
    return { addonKey: "TEAM_PACK", planKey: nextPlan(planKey) };
  }
  if (featureKey === "max_locations") {
    return { addonKey: "ADDITIONAL_LOCATION", planKey: nextPlan(planKey) };
  }
  if (featureKey === "max_qr_codes" || featureKey === "qr_enabled") {
    return { addonKey: "QR_PACK", planKey: "GROWTH" };
  }
  if (featureKey === "loyalty_enabled") {
    return { addonKey: "KASI_REWARDS", planKey: "SCALE" };
  }
  if (featureKey === "automation_enabled") {
    return { addonKey: "KASI_AUTOMATE", planKey: "SCALE" };
  }
  return { planKey: nextPlan(planKey) };
}

function nextPlan(planKey: string | null): string | undefined {
  const order = ["LAUNCH", "GROWTH", "PRO", "SCALE", "ENTERPRISE"];
  if (!planKey) return "GROWTH";
  const idx = order.indexOf(planKey);
  if (idx < 0 || idx >= order.length - 1) return undefined;
  return order[idx + 1];
}
