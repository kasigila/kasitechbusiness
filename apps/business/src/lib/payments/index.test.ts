import { describe, expect, it } from "vitest";
import {
  ManualPaymentProvider,
  HostedCheckoutProvider,
  acknowledgePaymentWebhook,
} from "./index";

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

  it("confirms manual payment", async () => {
    const provider = new ManualPaymentProvider();
    const intent = await provider.createIntent({
      businessId: "biz_1",
      amountMinor: 1000,
    });
    const confirmed = await provider.confirmManual?.(intent.id);
    expect(confirmed?.status).toBe("SUCCEEDED");
  });
});

describe("HostedCheckoutProvider", () => {
  it("returns checkout URL for mpesa", async () => {
    const provider = new HostedCheckoutProvider("mpesa");
    const intent = await provider.createIntent({
      businessId: "biz_1",
      amountMinor: 50000,
    });
    expect(intent.checkoutUrl).toContain("checkout");
    expect(intent.provider).toBe("mpesa");
  });
});

describe("acknowledgePaymentWebhook", () => {
  it("rejects when secret missing", () => {
    const prev = process.env.PAYMENT_WEBHOOK_SECRET;
    delete process.env.PAYMENT_WEBHOOK_SECRET;
    const result = acknowledgePaymentWebhook({
      signature: "x",
      provider: "mpesa",
      eventId: "evt_1",
    });
    expect(result.accepted).toBe(false);
    if (prev) process.env.PAYMENT_WEBHOOK_SECRET = prev;
  });
});
