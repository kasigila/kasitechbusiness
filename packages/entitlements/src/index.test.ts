import { describe, expect, it } from "vitest";
import {
  assertFeatureEnabled,
  checkLimit,
  isFeatureEnabled,
  resolveEntitlements,
  suggestUpgrade,
} from "./index";

describe("resolveEntitlements", () => {
  it("merges plan + addon + override", () => {
    const effective = resolveEntitlements({
      businessId: "b1",
      planKey: "GROWTH",
      planName: "Growth",
      planEntitlements: [
        { featureKey: "max_users", value: "5", valueType: "limit" },
        { featureKey: "loyalty_enabled", value: "false", valueType: "boolean" },
      ],
      addonEntitlements: [
        {
          featureKey: "max_users",
          value: "5",
          valueType: "limit",
          mergeStrategy: "add",
          quantity: 1,
        },
        {
          featureKey: "loyalty_enabled",
          value: "true",
          valueType: "boolean",
          mergeStrategy: "enable",
          quantity: 1,
        },
      ],
      overrides: [
        { featureKey: "max_users", value: "20", valueType: "limit" },
      ],
    });

    expect(effective.values.get("max_users")).toBe("20");
    expect(isFeatureEnabled(effective, "loyalty_enabled")).toBe(true);
  });

  it("ignores expired overrides", () => {
    const effective = resolveEntitlements({
      businessId: "b1",
      planKey: "LAUNCH",
      planName: "Launch",
      planEntitlements: [
        { featureKey: "max_users", value: "1", valueType: "limit" },
      ],
      overrides: [
        {
          featureKey: "max_users",
          value: "10",
          valueType: "limit",
          expiresAt: "2020-01-01T00:00:00.000Z",
        },
      ],
      now: new Date("2026-01-01"),
    });
    expect(effective.values.get("max_users")).toBe("1");
  });
});

describe("limits and features", () => {
  const growth = resolveEntitlements({
    businessId: "b1",
    planKey: "GROWTH",
    planName: "Growth",
    planEntitlements: [
      { featureKey: "max_users", value: "5", valueType: "limit" },
      { featureKey: "bookings_enabled", value: "true", valueType: "boolean" },
    ],
  });

  it("blocks when seat limit reached with actionable error", () => {
    const result = checkLimit({
      entitlements: growth,
      featureKey: "max_users",
      usage: 5,
      suggestedAddonKey: "TEAM_PACK",
      suggestedPlanKey: "PRO",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("PLAN_LIMIT_REACHED");
      expect(result.error.message).toContain("Growth");
      expect(result.error.details).toMatchObject({
        usage: 5,
        limit: 5,
        suggestedAddonKey: "TEAM_PACK",
      });
    }
  });

  it("allows under limit", () => {
    expect(
      checkLimit({ entitlements: growth, featureKey: "max_users", usage: 4 })
        .ok,
    ).toBe(true);
  });

  it("asserts feature availability", () => {
    expect(assertFeatureEnabled(growth, "bookings_enabled").ok).toBe(true);
    const blocked = assertFeatureEnabled(growth, "loyalty_enabled");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.code).toBe("FEATURE_NOT_AVAILABLE");
  });

  it("suggests upgrade paths", () => {
    expect(suggestUpgrade("max_users", "GROWTH")).toEqual({
      addonKey: "TEAM_PACK",
      planKey: "PRO",
    });
  });
});
