import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@kasitech/ui";
import {
  formatTzs,
  getLimit,
  isFeatureEnabled,
  resolveEntitlements,
} from "@kasitech/entitlements";
import {
  isUsingPreviewData,
  requireTenantContext,
} from "@/lib/auth/guards";
import {
  countActiveLocations,
  countActiveSeats,
  getEffectiveEntitlements,
  upgradeHintsForLimit,
} from "@/lib/entitlements/load";
import { createClient } from "@/lib/supabase/server";
import { UpgradeRequestForm } from "./upgrade-form";
import { PaymentStartForm } from "./payment-form";

export const metadata: Metadata = {
  title: "Billing",
};

export default async function BillingPage() {
  const { tenant } = await requireTenantContext();

  if (isUsingPreviewData()) {
    const entitlements = resolveEntitlements({
      businessId: tenant.businessId,
      planKey: "PRO",
      planName: "Pro",
      planEntitlements: [
        { featureKey: "max_users", value: "10", valueType: "limit" },
        { featureKey: "max_locations", value: "2", valueType: "limit" },
        { featureKey: "bookings_enabled", value: "true", valueType: "boolean" },
        { featureKey: "qr_enabled", value: "true", valueType: "boolean" },
        { featureKey: "loyalty_enabled", value: "false", valueType: "boolean" },
      ],
    });
    const seats = 4;
    const seatLimit = getLimit(entitlements, "max_users");
    const seatHints = upgradeHintsForLimit("max_users", "PRO");

    return (
      <BillingView
        planName="Pro"
        planPrice={800000}
        addonTotal={75000}
        recurringTotal={875000}
        subscriptionStatus="ONBOARDING"
        paymentStatus="PAID"
        billingStart="2026-08-01"
        addonRows={[{ name: "Team Pack", quantity: 1, price: 75000 }]}
        seats={seats}
        seatLimit={seatLimit}
        locations={1}
        locationLimit={2}
        entitlements={entitlements}
        seatHints={seatHints}
        atSeatLimit={false}
        preview
      />
    );
  }

  const entitlements = await getEffectiveEntitlements(tenant.businessId);
  const seats = await countActiveSeats(tenant.businessId);
  const locations = await countActiveLocations(tenant.businessId);

  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      `
      status,
      payment_status,
      monthly_price_minor,
      currency,
      billing_start_date,
      plans ( key, name, monthly_price_minor, currency )
    `,
    )
    .eq("business_id", tenant.businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: addons } = await supabase
    .from("business_addons")
    .select(
      `
      quantity,
      status,
      addons ( key, name, monthly_price_minor, currency )
    `,
    )
    .eq("business_id", tenant.businessId)
    .eq("status", "ACTIVE");

  const addonRows = (addons ?? []).map((row) => {
    const addon = Array.isArray(row.addons) ? row.addons[0] : row.addons;
    return {
      name: addon?.name ?? "Add-on",
      quantity: row.quantity as number,
      price: (addon?.monthly_price_minor as number | null) ?? 0,
    };
  });

  const plan = Array.isArray(subscription?.plans)
    ? subscription?.plans[0]
    : subscription?.plans;

  const addonTotal = addonRows.reduce(
    (sum, row) => sum + row.price * row.quantity,
    0,
  );
  const planPrice =
    subscription?.monthly_price_minor ?? plan?.monthly_price_minor ?? 0;
  const recurringTotal = Number(planPrice) + addonTotal;

  const seatLimit = getLimit(entitlements, "max_users");
  const locationLimit = getLimit(entitlements, "max_locations");
  const seatHints = upgradeHintsForLimit("max_users", entitlements.planKey);
  const atSeatLimit = seats >= seatLimit && seatLimit > 0;

  return (
    <BillingView
      planName={plan?.name ?? "Not assigned"}
      planPrice={Number(planPrice)}
      addonTotal={addonTotal}
      recurringTotal={recurringTotal}
      subscriptionStatus={subscription?.status ?? "—"}
      paymentStatus={subscription?.payment_status ?? "—"}
      billingStart={subscription?.billing_start_date ?? "—"}
      addonRows={addonRows}
      seats={seats}
      seatLimit={seatLimit}
      locations={locations}
      locationLimit={locationLimit}
      entitlements={entitlements}
      seatHints={seatHints}
      atSeatLimit={atSeatLimit}
    />
  );
}

function BillingView(props: {
  planName: string;
  planPrice: number;
  addonTotal: number;
  recurringTotal: number;
  subscriptionStatus: string;
  paymentStatus: string;
  billingStart: string;
  addonRows: Array<{ name: string; quantity: number; price: number }>;
  seats: number;
  seatLimit: number;
  locations: number;
  locationLimit: number;
  entitlements: ReturnType<typeof resolveEntitlements>;
  seatHints: { addonKey?: string; planKey?: string };
  atSeatLimit: boolean;
  preview?: boolean;
}) {
  return (
    <div>
      <PageHeader
        title="Billing"
        description={
          props.preview
            ? "Preview billing UX with demo Pro plan data."
            : "Current plan, add-ons, usage limits, and upgrade requests. Upgrades are reviewed by KasiTech — nothing is charged silently."
        }
      />

      <section className="mb-6 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5">
        <h2 className="text-lg font-semibold">Pay invoice</h2>
        <p className="mt-1 text-sm text-[var(--kb-muted)]">
          Manual bank recording works now. M-Pesa and card use your aggregator
          keys when configured — card numbers never touch KasiTech servers.
        </p>
        <PaymentStartForm defaultAmountMinor={props.planPrice ?? 150000} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5">
          <h2 className="text-lg font-semibold">Current plan</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--kb-muted)]">Plan</dt>
              <dd className="font-medium">{props.planName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--kb-muted)]">Monthly price</dt>
              <dd className="font-medium">{formatTzs(props.planPrice)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--kb-muted)]">Add-ons</dt>
              <dd className="font-medium">{formatTzs(props.addonTotal)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-[var(--kb-border)] pt-3">
              <dt className="font-medium">Total recurring</dt>
              <dd className="font-semibold">{formatTzs(props.recurringTotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--kb-muted)]">Subscription</dt>
              <dd>{props.subscriptionStatus}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--kb-muted)]">Payment status</dt>
              <dd>{props.paymentStatus}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--kb-muted)]">Billing start</dt>
              <dd>{props.billingStart}</dd>
            </div>
          </dl>
          {props.addonRows.length ? (
            <ul className="mt-4 space-y-2 border-t border-[var(--kb-border)] pt-4 text-sm">
              {props.addonRows.map((row) => (
                <li key={row.name} className="flex justify-between gap-3">
                  <span>
                    {row.name} × {row.quantity}
                  </span>
                  <span>{formatTzs(row.price * row.quantity)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[var(--kb-muted)]">No active add-ons.</p>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5">
          <h2 className="text-lg font-semibold">Usage vs limits</h2>
          <ul className="mt-4 space-y-4 text-sm">
            <li>
              <div className="flex justify-between">
                <span>Team seats</span>
                <span className="font-medium">
                  {props.seats} / {props.seatLimit}
                </span>
              </div>
              {props.atSeatLimit ? (
                <div className="mt-3 rounded-xl bg-[var(--kb-surface-2)] p-3">
                  <p className="font-medium">
                    You&apos;ve reached your {props.entitlements.planName ?? "current"}{" "}
                    plan&apos;s {props.seatLimit}-user limit.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {props.seatHints.addonKey ? (
                      <UpgradeRequestForm
                        requestType="ADDON"
                        targetAddonKey={props.seatHints.addonKey}
                        featureKey="max_users"
                        label="Request Add-on"
                      />
                    ) : null}
                    {props.seatHints.planKey ? (
                      <UpgradeRequestForm
                        requestType="UPGRADE_PLAN"
                        targetPlanKey={props.seatHints.planKey}
                        featureKey="max_users"
                        label="Request Upgrade"
                      />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </li>
            <li className="flex justify-between">
              <span>Locations</span>
              <span className="font-medium">
                {props.locations} / {props.locationLimit}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Bookings</span>
              <span className="font-medium">
                {isFeatureEnabled(props.entitlements, "bookings_enabled")
                  ? "Included"
                  : "Not on plan"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>QR</span>
              <span className="font-medium">
                {isFeatureEnabled(props.entitlements, "qr_enabled")
                  ? "Included"
                  : "Not on plan"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Loyalty</span>
              <span className="font-medium">
                {isFeatureEnabled(props.entitlements, "loyalty_enabled")
                  ? "Included"
                  : "Not on plan"}
              </span>
            </li>
          </ul>
          <div className="mt-6">
            <Link
              href="/app/team"
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              Manage team seats
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
