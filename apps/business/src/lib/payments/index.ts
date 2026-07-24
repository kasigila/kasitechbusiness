/**
 * Tanzania-ready payments abstraction.
 * Concrete providers (M-Pesa, card, bank transfer) plug in later —
 * billing UI and invoices must not hard-code a processor.
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
  metadata?: Record<string, unknown>;
};

export type CreatePaymentInput = {
  businessId: string;
  amountMinor: number;
  currency?: string;
  provider?: PaymentProviderKey;
  description?: string;
  metadata?: Record<string, unknown>;
};

export interface PaymentProvider {
  key: PaymentProviderKey;
  createIntent(input: CreatePaymentInput): Promise<PaymentIntent>;
  getIntent(id: string): Promise<PaymentIntent | null>;
}

/** Manual / offline recording until a live TZ gateway is configured. */
export class ManualPaymentProvider implements PaymentProvider {
  key: PaymentProviderKey = "manual";
  private store = new Map<string, PaymentIntent>();

  async createIntent(input: CreatePaymentInput): Promise<PaymentIntent> {
    const intent: PaymentIntent = {
      id: `pay_${Date.now().toString(36)}`,
      businessId: input.businessId,
      amountMinor: input.amountMinor,
      currency: input.currency ?? "TZS",
      provider: this.key,
      status: "PENDING",
      metadata: input.metadata,
    };
    this.store.set(intent.id, intent);
    return intent;
  }

  async getIntent(id: string): Promise<PaymentIntent | null> {
    return this.store.get(id) ?? null;
  }
}

let defaultProvider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (!defaultProvider) {
    defaultProvider = new ManualPaymentProvider();
  }
  return defaultProvider;
}

export function setPaymentProvider(provider: PaymentProvider) {
  defaultProvider = provider;
}
