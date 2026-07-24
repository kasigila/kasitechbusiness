import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@kasitech/ui";
import {
  getActiveBusinessId,
  requireActor,
} from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function AppHomePage() {
  const actor = await requireActor();
  const businessId = await getActiveBusinessId(actor);

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
    .in("status", ["ONBOARDING", "ACTIVE", "PAST_DUE", "GRACE_PERIOD", "RESTRICTED"])
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
        description="Your configured workspace will expand as onboarding and modules are published. Phase 2 adds plan entitlements and usage limits."
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
