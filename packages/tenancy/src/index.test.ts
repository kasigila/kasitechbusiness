import { describe, expect, it } from "vitest";
import {
  isCommandCenterAllowed,
  resolveTenantContext,
  type ActorContext,
} from "./index";

const baseActor = (over: Partial<ActorContext> = {}): ActorContext => ({
  userId: "user-a",
  email: "a@example.com",
  internalRoles: [],
  memberships: [
    {
      id: "m1",
      businessId: "biz-a",
      userId: "user-a",
      roleKey: "BUSINESS_OWNER",
      status: "ACTIVE",
      permissions: ["team.invite"],
    },
  ],
  ...over,
});

describe("resolveTenantContext", () => {
  it("requires authentication", () => {
    const result = resolveTenantContext(null, "biz-a");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHENTICATED");
  });

  it("allows member of requested business", () => {
    const result = resolveTenantContext(baseActor(), "biz-a");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.businessId).toBe("biz-a");
  });

  it("does not leak other businesses — returns NOT_FOUND", () => {
    const result = resolveTenantContext(baseActor(), "biz-b");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("ignores deactivated memberships", () => {
    const actor = baseActor({
      memberships: [
        {
          id: "m1",
          businessId: "biz-a",
          userId: "user-a",
          roleKey: "STAFF",
          status: "DEACTIVATED",
          permissions: [],
        },
      ],
    });
    const result = resolveTenantContext(actor, "biz-a");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("blocks silent staff tenant entry", () => {
    const actor = baseActor({
      internalRoles: ["KASITECH_SUPPORT"],
      memberships: [],
    });
    const result = resolveTenantContext(actor, "biz-a");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
  });
});

describe("command center gate", () => {
  it("allows internal roles only", () => {
    expect(isCommandCenterAllowed(baseActor())).toBe(false);
    expect(
      isCommandCenterAllowed(
        baseActor({ internalRoles: ["KASITECH_SUPER_ADMIN"] }),
      ),
    ).toBe(true);
  });
});
