import { describe, expect, it } from "vitest";
import {
  filterNavigationByEntitlements,
  recommendWorkspace,
  resolveTerminology,
} from "./index";

describe("recommendWorkspace", () => {
  it("builds hospitality workspace with menu terminology", () => {
    const ws = recommendWorkspace({
      industry: "hospitality",
      sells: ["food", "drinks"],
      operations: ["reservations", "tables", "events"],
      morningPriorities: ["reservations"],
    });
    expect(ws.terminology.customer).toBe("guest");
    expect(ws.terminology.catalog).toBe("menu");
    expect(ws.navigation.some((n) => n.href === "/app/catalog")).toBe(true);
    expect(ws.navigation.some((n) => n.href === "/app/bookings")).toBe(true);
  });

  it("builds salon workspace with appointments", () => {
    const ws = recommendWorkspace({
      industry: "beauty_wellness",
      sells: ["services"],
      operations: ["appointments"],
      morningPriorities: [],
    });
    expect(ws.terminology.booking).toBe("appointment");
    expect(ws.terminology.staff).toBe("stylists");
  });
});

describe("entitlement filter", () => {
  it("hides locked modules", () => {
    const nav = recommendWorkspace({
      industry: "hospitality",
      sells: ["food"],
      operations: ["reservations", "tables"],
      morningPriorities: [],
    }).navigation;
    const filtered = filterNavigationByEntitlements(
      nav,
      new Set(["catalog_enabled", "basic_analytics_enabled"]),
    );
    expect(filtered.some((n) => n.href === "/app/bookings")).toBe(false);
    expect(filtered.some((n) => n.href === "/app/catalog")).toBe(true);
  });
});

describe("terminology", () => {
  it("resolves custom terms", () => {
    expect(resolveTerminology({ customer: "guest" }, "customer")).toBe("guest");
    expect(resolveTerminology({}, "customer", "Customer")).toBe("Customer");
  });
});
