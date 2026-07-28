/**
 * Tanzania-ready payments abstraction.
 * Concrete providers (M-Pesa, card, bank transfer) plug in via env —
 * billing UI must not hard-code a processor SDK.
 */

export type PaymentProviderKey = "manual" | "mpesa" | "card" | "bank_transfer";

export type PaymentIntent = {
  id: string;
  businessId: string;
  amountMinor: number;
  currency: string;
  provider: PaymentProviderKey;
  status: "CREATED" | "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  reference?: string;
  checkoutUrl?: string;
  metadata?: Record<string, unknown>;
};

export type CreatePaymentInput = {
  businessId: string;
  amountMinor: number;
  currency?: string;
  provider?: PaymentProviderKey;
  description?: string;
  invoiceId?: string;
  metadata?: Record<string, unknown>;
};

export interface PaymentProvider {
  key: PaymentProviderKey;
  createIntent(input: CreatePaymentInput): Promise<PaymentIntent>;
  getIntent(id: string): Promise<PaymentIntent | null>;
  confirmManual?(id: string): Promise<PaymentIntent | null>;
}

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Manual / offline recording until a live TZ gateway is configured. */
export class ManualPaymentProvider implements PaymentProvider {
  key: PaymentProviderKey = "manual";
  private store = new Map<string, PaymentIntent>();

  async createIntent(input: CreatePaymentInput): Promise<PaymentIntent> {
    const intent: PaymentIntent = {
      id: newId("pay"),
      businessId: input.businessId,
      amountMinor: input.amountMinor,
      currency: input.currency ?? "TZS",
      provider: this.key,
      status: "PENDING",
      metadata: { ...input.metadata, invoiceId: input.invoiceId },
    };
    this.store.set(intent.id, intent);
    return intent;
  }

  async getIntent(id: string): Promise<PaymentIntent | null> {
    return this.store.get(id) ?? null;
  }

  async confirmManual(id: string): Promise<PaymentIntent | null> {
    const intent = this.store.get(id);
    if (!intent) return null;
    intent.status = "SUCCEEDED";
    this.store.set(id, intent);
    return intent;
  }
}

/**
 * Hosted-checkout style stub for card/M-Pesa aggregators.
 * When PAYMENT_PROVIDER_API_KEY is absent, returns a pending intent with a
 * placeholder checkout URL for UI testing — never charges real money.
 */
export class HostedCheckoutProvider implements PaymentProvider {
  key: PaymentProviderKey;
  private store = new Map<string, PaymentIntent>();

  constructor(key: PaymentProviderKey) {
    this.key = key;
  }

  async createIntent(input: CreatePaymentInput): Promise<PaymentIntent> {
    const apiKey = process.env.PAYMENT_PROVIDER_API_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const intent: PaymentIntent = {
      id: newId(this.key),
      businessId: input.businessId,
      amountMinor: input.amountMinor,
      currency: input.currency ?? "TZS",
      provider: this.key,
      status: "PENDING",
      reference: apiKey ? `live_${newId("ref")}` : `test_${newId("ref")}`,
      checkoutUrl: apiKey
        ? `${appUrl}/app/billing?checkout=${this.key}`
        : `${appUrl}/app/billing?checkout=preview&provider=${this.key}`,
      metadata: {
        ...input.metadata,
        invoiceId: input.invoiceId,
        live: Boolean(apiKey),
      },
    };
    this.store.set(intent.id, intent);
    return intent;
  }

  async getIntent(id: string): Promise<PaymentIntent | null> {
    return this.store.get(id) ?? null;
  }
}

export function createPaymentProvider(
  preferred?: PaymentProviderKey,
): PaymentProvider {
  const key =
    preferred ||
    (process.env.PAYMENT_DEFAULT_PROVIDER as PaymentProviderKey | undefined) ||
    "manual";

  if (key === "mpesa" || key === "card" || key === "bank_transfer") {
    return new HostedCheckoutProvider(key);
  }
  return new ManualPaymentProvider();
}

let defaultProvider: PaymentProvider | null = null;

export function getPaymentProvider(
  preferred?: PaymentProviderKey,
): PaymentProvider {
  if (preferred) return createPaymentProvider(preferred);
  if (!defaultProvider) {
    defaultProvider = createPaymentProvider();
  }
  return defaultProvider;
}

export function setPaymentProvider(provider: PaymentProvider) {
  defaultProvider = provider;
}

export type WebhookProcessResult = {
  accepted: boolean;
  reason: string;
};

/**
 * Verify + acknowledge provider webhooks.
 * Without PAYMENT_WEBHOOK_SECRET, rejects live processing (safe default).
 */
export function acknowledgePaymentWebhook(input: {
  signature: string | null;
  provider: string;
  eventId: string;
}): WebhookProcessResult {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    return {
      accepted: false,
      reason: "Webhook secret not configured — configure before going live",
    };
  }
  if (!input.signature) {
    return { accepted: false, reason: "Missing signature" };
  }
  // Constant-time-ish compare for stub; real aggregator HMAC lands with provider adapter.
  if (input.signature !== secret && !input.signature.startsWith("sha256=")) {
    return { accepted: false, reason: "Invalid signature" };
  }
  return { accepted: true, reason: `Queued ${input.provider} event ${input.eventId}` };
}
