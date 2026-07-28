import { describe, expect, it } from "vitest";
import { evaluateBillingPolicy, isMutatingRestricted } from "./policy";

describe("evaluateBillingPolicy", () => {
  it("moves active unpaid into past due", () => {
    const d = evaluateBillingPolicy("ACTIVE", {
      subscriptionStatus: "PAST_DUE",
      paymentStatus: "PAST_DUE",
      daysPastDue: 2,
    });
    expect(d?.nextStatus).toBe("PAST_DUE");
  });

  it("suspends after 30 days", () => {
    const d = evaluateBillingPolicy("RESTRICTED", {
      subscriptionStatus: "PAST_DUE",
      paymentStatus: "FAILED",
      daysPastDue: 31,
    });
    expect(d?.nextStatus).toBe("SUSPENDED");
    expect(d?.restrictWorkspace).toBe(true);
  });

  it("restores when paid", () => {
    const d = evaluateBillingPolicy("SUSPENDED", {
      subscriptionStatus: "ACTIVE",
      paymentStatus: "PAID",
      daysPastDue: 0,
    });
    expect(d?.nextStatus).toBe("ACTIVE");
  });
});

describe("isMutatingRestricted", () => {
  it("blocks restricted and suspended", () => {
    expect(isMutatingRestricted("RESTRICTED")).toBe(true);
    expect(isMutatingRestricted("ACTIVE")).toBe(false);
  });
});
