import { describe, expect, it } from "vitest";
import { isForbiddenPublicAuthPath } from "@kasitech/auth";
import { resolveTenantContext, type ActorContext } from "@kasitech/tenancy";

/**
 * Baseline tenant isolation tests (application layer).
 * Full RLS integration tests require a live Supabase/Postgres in CI (Phase 10).
 */
describe("tenant isolation — application layer", () => {
  const userA: ActorContext = {
    userId: "user-a",
    email: "a@lido.test",
    internalRoles: [],
    memberships: [
      {
        id: "m-a",
        businessId: "business-a",
        userId: "user-a",
        roleKey: "BUSINESS_OWNER",
        status: "ACTIVE",
        permissions: ["catalog.edit"],
      },
    ],
  };

  it("blocks Business A user from Business B context", () => {
    const result = resolveTenantContext(userA, "business-b");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("allows Business A user for Business A only", () => {
    const result = resolveTenantContext(userA, "business-a");
    expect(result.ok).toBe(true);
  });
});

describe("no public registration routes", () => {
  it("forbids signup paths", () => {
    for (const path of [
      "/signup",
      "/register",
      "/create-account",
      "/create-organization",
      "/trial",
    ]) {
      expect(isForbiddenPublicAuthPath(path)).toBe(true);
    }
  });
});
