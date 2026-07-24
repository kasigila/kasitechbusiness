import { describe, expect, it } from "vitest";
import { resolveEntitlements } from "@kasitech/entitlements";
import {
  assertLocationAvailable,
  assertSeatAvailable,
} from "./enforce";

describe("seat enforcement", () => {
  const entitlements = resolveEntitlements({
    businessId: "b1",
    planKey: "GROWTH",
    planName: "Growth",
    planEntitlements: [
      { featureKey: "max_users", value: "5", valueType: "limit" },
      { featureKey: "max_locations", value: "1", valueType: "limit" },
    ],
  });

  it("blocks invite when seats are full", () => {
    const result = assertSeatAvailable({
      entitlements,
      activeSeatCount: 5,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("PLAN_LIMIT_REACHED");
      expect(String(result.error.message)).toContain("5-user");
    }
  });

  it("allows invite under seat limit", () => {
    expect(
      assertSeatAvailable({ entitlements, activeSeatCount: 3 }).ok,
    ).toBe(true);
  });

  it("blocks second location on Growth", () => {
    const result = assertLocationAvailable({
      entitlements,
      activeLocationCount: 1,
    });
    expect(result.ok).toBe(false);
  });
});
