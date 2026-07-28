"use server";

import { revalidatePath } from "next/cache";
import {
  fail,
  liveSuccess,
  previewSuccess,
  usingPreview,
  type ActionMessage,
} from "@/lib/actions/result";
import { requireTenantContext, requireCommandAccess } from "@/lib/auth/guards";
import {
  getPaymentProvider,
  type PaymentProviderKey,
} from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateBillingPolicy } from "@/lib/billing/policy";

export async function startPaymentAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const amountMinor = Number(formData.get("amountMinor") || "0");
  const provider = (String(formData.get("provider") || "manual") ||
    "manual") as PaymentProviderKey;
  const invoiceId = String(formData.get("invoiceId") || "").trim() || undefined;

  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    return fail("Enter a valid amount.");
  }

  if (usingPreview()) {
    const intent = await getPaymentProvider(provider).createIntent({
      businessId: "preview",
      amountMinor,
      provider,
      invoiceId,
    });
    return previewSuccess(`Payment intent created via ${provider} (preview).`, {
      intentId: intent.id,
      checkoutUrl: intent.checkoutUrl,
    });
  }

  const { actor, tenant } = await requireTenantContext();
  if (!tenant.permissions.has("billing.view")) {
    return fail("You do not have billing access.");
  }

  const providerClient = getPaymentProvider(provider);
  const intent = await providerClient.createIntent({
    businessId: tenant.businessId,
    amountMinor,
    provider,
    invoiceId,
  });

  const supabase = await createClient();
  await supabase.from("payment_intents").insert({
    business_id: tenant.businessId,
    invoice_id: invoiceId ?? null,
    provider,
    amount_minor: amountMinor,
    currency: "TZS",
    status: intent.status,
    provider_ref: intent.reference ?? null,
    checkout_url: intent.checkoutUrl ?? null,
    metadata: intent.metadata ?? {},
    created_by: actor.userId,
  });

  revalidatePath("/app/billing");
  return liveSuccess(
    intent.checkoutUrl
      ? `Continue checkout (${provider}).`
      : `Payment recorded as ${intent.status}.`,
    { checkoutUrl: intent.checkoutUrl, intentId: intent.id },
  );
}

export async function markInvoicePaidAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const businessId = String(formData.get("businessId") || "").trim();
  const invoiceId = String(formData.get("invoiceId") || "").trim();
  if (!businessId || !invoiceId) return fail("Business and invoice required.");

  await requireCommandAccess();

  if (usingPreview()) {
    return previewSuccess("Invoice marked paid (preview).");
  }

  try {
    const admin = createAdminClient();
    await admin
      .from("invoices")
      .update({ status: "PAID", paid_at: new Date().toISOString() })
      .eq("id", invoiceId)
      .eq("business_id", businessId);

    await admin
      .from("subscriptions")
      .update({ payment_status: "PAID", status: "ACTIVE" })
      .eq("business_id", businessId);

    await admin
      .from("businesses")
      .update({ status: "ACTIVE" })
      .eq("id", businessId);

    await admin.from("billing_policy_events").insert({
      business_id: businessId,
      to_status: "ACTIVE",
      reason: "Manual payment confirmation",
    });

    await admin.from("audit_logs").insert({
      business_id: businessId,
      actor_type: "STAFF",
      action: "billing.payment_confirm",
      resource_type: "invoice",
      resource_id: invoiceId,
    });

    revalidatePath(`/command/businesses/${businessId}`);
    return liveSuccess("Invoice marked paid and business restored to ACTIVE.");
  } catch {
    return fail("Could not mark invoice paid.");
  }
}

export async function runBillingPolicyAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const businessId = String(formData.get("businessId") || "").trim();
  if (!businessId) return fail("Business id required.");
  await requireCommandAccess();

  if (usingPreview()) {
    const decision = evaluateBillingPolicy("ACTIVE", {
      subscriptionStatus: "PAST_DUE",
      paymentStatus: "PAST_DUE",
      daysPastDue: 10,
    });
    return previewSuccess(
      `Policy preview: would move to ${decision?.nextStatus ?? "unchanged"}.`,
    );
  }

  try {
    const admin = createAdminClient();
    const { data: business } = await admin
      .from("businesses")
      .select("status")
      .eq("id", businessId)
      .maybeSingle();
    const { data: sub } = await admin
      .from("subscriptions")
      .select("status, payment_status, updated_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!business || !sub) return fail("Business or subscription missing.");

    const daysPastDue =
      sub.payment_status === "PAID"
        ? 0
        : Math.floor(
            (Date.now() - new Date(sub.updated_at).getTime()) /
              (1000 * 60 * 60 * 24),
          );

    const decision = evaluateBillingPolicy(business.status as never, {
      subscriptionStatus: sub.status,
      paymentStatus: sub.payment_status,
      daysPastDue,
    });

    if (!decision) return liveSuccess("No status change required.");

    await admin
      .from("businesses")
      .update({ status: decision.nextStatus })
      .eq("id", businessId);

    await admin.from("billing_policy_events").insert({
      business_id: businessId,
      from_status: business.status,
      to_status: decision.nextStatus,
      reason: decision.reason,
    });

    return liveSuccess(`Business status → ${decision.nextStatus}.`);
  } catch {
    return fail("Policy evaluation failed.");
  }
}
