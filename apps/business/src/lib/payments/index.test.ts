import { describe, expect, it } from "vitest";
import { ManualPaymentProvider } from "./index";

describe("ManualPaymentProvider", () => {
  it("creates a pending TZS intent", async () => {
    const provider = new ManualPaymentProvider();
    const intent = await provider.createIntent({
      businessId: "biz_1",
      amountMinor: 150000,
    });
    expect(intent.currency).toBe("TZS");
    expect(intent.status).toBe("PENDING");
    expect(intent.provider).toBe("manual");
    expect(await provider.getIntent(intent.id)).toEqual(intent);
  });
});
