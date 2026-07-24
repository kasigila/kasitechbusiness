import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COMMERCIAL_MIGRATION,
  FOUNDATION_MIGRATION,
  ADMIN_IMPLEMENTATION_MIGRATION,
  OPERATIONS_MIGRATION,
  MIGRATIONS,
} from "./index";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("foundation migration", () => {
  const sql = readFileSync(join(root, "migrations", FOUNDATION_MIGRATION), "utf8");

  it("enables RLS on tenant tables", () => {
    for (const table of [
      "profiles",
      "businesses",
      "business_memberships",
      "invitations",
      "audit_logs",
    ]) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("defines membership helper", () => {
    expect(sql).toContain("is_business_member");
    expect(sql).toContain("has_business_permission");
  });

  it("does not create public registration tables", () => {
    expect(sql.toLowerCase()).not.toContain("create table public.signups");
  });
});

describe("commercial migration", () => {
  const sql = readFileSync(join(root, "migrations", COMMERCIAL_MIGRATION), "utf8");

  it("is listed in migration order", () => {
    expect(MIGRATIONS).toEqual([
      FOUNDATION_MIGRATION,
      COMMERCIAL_MIGRATION,
      ADMIN_IMPLEMENTATION_MIGRATION,
      OPERATIONS_MIGRATION,
    ]);
  });

  it("operations migration covers discovery and CMS", () => {
    const sql = readFileSync(join(root, "migrations", OPERATIONS_MIGRATION), "utf8");
    expect(sql).toContain("discovery_questionnaires");
    expect(sql).toContain("website_pages");
    expect(sql).toContain("catalog_items");
    expect(sql).toContain("support_tickets");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("'bookings'");
  });

  it("seeds Launch/Growth/Pro/Scale/Enterprise", () => {
    for (const key of ["LAUNCH", "GROWTH", "PRO", "SCALE", "ENTERPRISE"]) {
      expect(sql).toContain(`'${key}'`);
    }
  });

  it("enables RLS on commercial tenant tables", () => {
    for (const table of [
      "subscriptions",
      "business_addons",
      "upgrade_requests",
      "locations",
    ]) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("stores plan prices as configurable DB values", () => {
    expect(sql).toContain("monthly_price_minor");
    expect(sql).toContain("150000");
    expect(sql).toContain("400000");
  });
});
