import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FOUNDATION_MIGRATION } from "./index";

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
