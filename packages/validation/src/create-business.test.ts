import { describe, expect, it } from "vitest";
import { createBusinessSchema } from "@kasitech/validation";

describe("createBusinessSchema", () => {
  it("accepts a valid create-business payload", () => {
    const parsed = createBusinessSchema.safeParse({
      legalName: "Lido Slipway Limited",
      displayName: "Lido Slipway",
      slug: "lido-slipway",
      primaryIndustry: "hospitality",
      capabilities: ["restaurant", "events"],
      planKey: "PRO",
      ownerName: "Owner Name",
      ownerEmail: "owner@lido.test",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid slugs", () => {
    const parsed = createBusinessSchema.safeParse({
      legalName: "Test",
      displayName: "Test",
      slug: "Bad Slug",
      primaryIndustry: "hospitality",
      planKey: "LAUNCH",
      ownerName: "Owner",
      ownerEmail: "owner@test.com",
    });
    expect(parsed.success).toBe(false);
  });
});
