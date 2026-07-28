import { NextResponse } from "next/server";
import { acknowledgePaymentWebhook } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Payment provider webhook endpoint.
 * Configure PAYMENT_WEBHOOK_SECRET before accepting live events.
 * Without secrets this safely rejects processing.
 */
export async function POST(request: Request) {
  const limited = rateLimit({
    key: `webhook:payments:${request.headers.get("x-forwarded-for") || "local"}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!limited.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const signature =
    request.headers.get("x-payment-signature") ||
    request.headers.get("stripe-signature") ||
    request.headers.get("verif-hash");

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const provider = String(body.provider || request.headers.get("x-provider") || "unknown");
  const eventId = String(body.id || body.event_id || crypto.randomUUID());

  const result = acknowledgePaymentWebhook({
    signature,
    provider,
    eventId,
  });

  if (!result.accepted) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 401 });
  }

  // Persistence of payment_events requires service role + applied migration 0005.
  // Adapter-specific status mapping lands with the chosen aggregator credentials.

  return NextResponse.json({ ok: true, reason: result.reason });
}
