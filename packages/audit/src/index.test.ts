import { describe, expect, it } from "vitest";
import { createMemoryAuditWriter } from "./index";

describe("audit writer", () => {
  it("appends immutable-style records", async () => {
    const writer = createMemoryAuditWriter();
    const record = await writer.write({
      actorType: "STAFF",
      actorUserId: "admin-1",
      action: "business.create",
      resourceType: "business",
      resourceId: "biz-1",
      newValues: { slug: "lido" },
    });
    expect(record.id).toBeTruthy();
    expect(writer.events).toHaveLength(1);
    expect(writer.events[0]?.action).toBe("business.create");
  });
});
