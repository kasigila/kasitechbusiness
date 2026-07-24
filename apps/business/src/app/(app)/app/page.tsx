import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@kasitech/ui";
import {
  getActiveBusinessId,
  isUsingPreviewData,
  requireActor,
} from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_BUSINESS } from "@/lib/preview";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function AppHomePage() {
  const actor = await requireActor();
  const businessId = await getActiveBusinessId(actor);

  if (isUsingPreviewData()) {
    return (
      <div>
        <PageHeader
          title={PREVIEW_BUSINESS.display_name}
          description="Preview workspace — configured modules appear after discovery and launch. This is demo data."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Status", value: "ONBOARDING" },
            { label: "Plan", value: "Pro" },
            { label: "Industry", value: "Hospitality" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--kb-muted)]">
                {card.label}
              </p>
              <p className="mt-2 text-lg font-semibold">{card.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { label: "Website visitors", value: "1,284" },
            { label: "Reservations today", value: "12" },
            { label: "Open table requests", value: "3" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5"
            >
              <p className="text-sm text-[var(--kb-muted)]">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                {card.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app/team" className="kb-btn kb-btn-secondary">
            Team
          </Link>
          <Link href="/app/billing" className="kb-btn kb-btn-secondary">
            Billing
          </Link>
          <Link href="/preview" className="kb-btn kb-btn-ghost">
            Preview hub
          </Link>
        </div>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div>
        <PageHeader
          title="Welcome to KasiTech Business"
          description="Select or await a business workspace assignment."
        />
        <EmptyState
          title="No active workspace"
          description="KasiTech creates businesses and invites authorized users. If you expected access, contact your KasiTech implementation lead."
          action={
            <a href="/app/select-business" className="kb-btn kb-btn-primary">
              Choose business
            </a>
          }
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, display_name, status, primary_industry, slug")
    .eq("id", businessId)
    .maybeSingle();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      `
      status,
      plans (
        key,
        name,
        monthly_price_minor,
        currency
      )
    `,
    )
    .eq("business_id", businessId)
    .in("status", [
      "ONBOARDING",
      "ACTIVE",
      "PAST_DUE",
      "GRACE_PERIOD",
      "RESTRICTED",
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const plan = Array.isArray(subscription?.plans)
    ? subscription?.plans[0]
    : subscription?.plans;

  return (
    <div>
      <PageHeader
        title={business?.display_name ?? "Your workspace"}
        description="Your configured workspace will expand as onboarding and modules are published."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--kb-muted)]">
            Status
          </p>
          <p className="mt-2 text-lg font-semibold">
            {business?.status ?? "UNKNOWN"}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--kb-muted)]">
            Plan
          </p>
          <p className="mt-2 text-lg font-semibold">
            {plan?.name ?? "Not assigned"}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--kb-muted)]">
            Industry
          </p>
          <p className="mt-2 text-lg font-semibold">
            {business?.primary_industry ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <EmptyState
          title="Operational modules arrive with configuration"
          description="You will not see empty enterprise modules. Launch customers get a focused workspace; Growth/Pro unlock bookings, QR, and more via entitlements."
        />
      </div>
    </div>
  );
}
