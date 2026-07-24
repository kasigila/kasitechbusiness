import { describe, expect, it } from "vitest";
import { ROLE_PERMISSION_DEFAULTS, hasPermission } from "./index";

describe("hasPermission", () => {
  it("requires all listed permissions", () => {
    const granted = new Set(["bookings.view", "catalog.edit"]);
    expect(hasPermission(granted, "bookings.view")).toBe(true);
    expect(hasPermission(granted, ["bookings.view", "catalog.edit"])).toBe(
      true,
    );
    expect(hasPermission(granted, ["bookings.view", "team.invite"])).toBe(
      false,
    );
  });

  it("gives owners full catalog", () => {
    expect(ROLE_PERMISSION_DEFAULTS.BUSINESS_OWNER).toContain("team.invite");
    expect(ROLE_PERMISSION_DEFAULTS.VIEWER).not.toContain("team.invite");
  });
});
