import {
  resolveEntitlements,
  suggestUpgrade,
  type EffectiveEntitlements,
  type FeatureValueType,
} from "@kasitech/entitlements";
import { createClient } from "@/lib/supabase/server";

type FeatureRow = { key: string; value_type: FeatureValueType };

/**
 * Load and resolve effective entitlements for a business.
 * Server-side only — never trust client-reported plan limits.
 */
export async function getEffectiveEntitlements(
  businessId: string,
): Promise<EffectiveEntitlements> {
  const empty = resolveEntitlements({
    businessId,
    planKey: null,
    planName: null,
    planEntitlements: [],
  });

  const supabase = await createClient();

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      status,
      plan_id,
      plans (
        key,
        name
      )
    `,
    )
    .eq("business_id", businessId)
    .in("status", [
      "ONBOARDING",
      "ACTIVE",
      "PAST_DUE",
      "GRACE_PERIOD",
      "RESTRICTED",
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError || !subscription) {
    return empty;
  }

  const plan = Array.isArray(subscription.plans)
    ? subscription.plans[0]
    : subscription.plans;

  const [
    { data: features },
    { data: planEntitlementRows },
    { data: businessAddons },
    { data: overrides },
  ] = await Promise.all([
    supabase.from("features").select("key, value_type"),
    supabase
      .from("plan_entitlements")
      .select("feature_key, value")
      .eq("plan_id", subscription.plan_id),
    supabase
      .from("business_addons")
      .select(
        `
          quantity,
          status,
          addon_id,
          addons (
            key,
            addon_entitlements ( feature_key, value, merge_strategy )
          )
        `,
      )
      .eq("business_id", businessId)
      .eq("status", "ACTIVE"),
    supabase
      .from("business_entitlement_overrides")
      .select("feature_key, value, expires_at")
      .eq("business_id", businessId),
  ]);

  const featureType = new Map(
    ((features ?? []) as FeatureRow[]).map((f) => [f.key, f.value_type]),
  );

  const planEntitlements = (planEntitlementRows ?? []).map((row) => ({
    featureKey: row.feature_key as string,
    value: row.value as string,
    valueType: featureType.get(row.feature_key as string) ?? "boolean",
  }));

  const addonEntitlements = [];
  for (const row of businessAddons ?? []) {
    const addon = Array.isArray(row.addons) ? row.addons[0] : row.addons;
    const ents = addon?.addon_entitlements ?? [];
    for (const ent of ents) {
      addonEntitlements.push({
        featureKey: ent.feature_key as string,
        value: ent.value as string,
        valueType: featureType.get(ent.feature_key as string) ?? "boolean",
        mergeStrategy: (ent.merge_strategy ?? "add") as
          | "add"
          | "max"
          | "replace"
          | "enable",
        quantity: row.quantity as number,
      });
    }
  }

  return resolveEntitlements({
    businessId,
    planKey: plan?.key ?? null,
    planName: plan?.name ?? null,
    planEntitlements,
    addonEntitlements,
    overrides: (overrides ?? []).map((o) => ({
      featureKey: o.feature_key as string,
      value: o.value as string,
      valueType: featureType.get(o.feature_key as string) ?? "boolean",
      expiresAt: o.expires_at as string | null,
    })),
  });
}

export async function countActiveSeats(businessId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("business_memberships")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "ACTIVE");
  return count ?? 0;
}

export async function countActiveLocations(businessId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "ACTIVE");
  return count ?? 0;
}

export function upgradeHintsForLimit(
  featureKey: string,
  planKey: string | null,
) {
  return suggestUpgrade(featureKey, planKey);
}
