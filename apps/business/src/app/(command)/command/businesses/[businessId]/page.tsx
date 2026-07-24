import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, EmptyState, PageHeader } from "@kasitech/ui";
import { formatTzs } from "@kasitech/entitlements";
import {
  isUsingPreviewData,
  requireCommandAccess,
} from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_BUSINESS } from "@/lib/preview";

export const metadata: Metadata = {
  title: "Business 360",
};

const SECTIONS = [
  "Overview",
  "Workspace",
  "Discovery",
  "Website",
  "Users",
  "Roles",
  "Locations",
  "Plan",
  "Add-ons",
  "Entitlements",
  "Billing",
  "Implementation",
  "Support",
  "Audit Log",
  "Domains",
  "Integrations",
  "Analytics",
  "Internal Notes",
] as const;

export default async function Business360Page({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  await requireCommandAccess();
  const { businessId } = await params;

  if (isUsingPreviewData()) {
    if (
      businessId !== PREVIEW_BUSINESS.id &&
      businessId !== "00000000-0000-4000-8000-000000000002"
    ) {
      notFound();
    }

    const isLido = businessId === PREVIEW_BUSINESS.id;
    const business = isLido
      ? PREVIEW_BUSINESS
      : {
          ...PREVIEW_BUSINESS,
          id: businessId,
          display_name: "Zuri Salon",
          slug: "zuri-salon",
          primary_industry: "beauty_wellness",
          status: "ACTIVE",
        };

    return (
      <Business360View
        business={business}
        planName={isLido ? "Pro" : "Growth"}
        planPrice={isLido ? 800000 : 400000}
        implementationStatus={isLido ? "DISCOVERY" : "LIVE"}
        seats={`${isLido ? 4 : 3} / ${isLido ? 10 : 5}`}
        preview
      />
    );
  }

  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, legal_name, display_name, slug, status, primary_industry, country, currency, timezone, email, owner_name, owner_email, created_at",
    )
    .eq("id", businessId)
    .maybeSingle();

  if (!business) notFound();

  const [{ data: subscription }, { data: project }, { data: capabilities }, { count: seatCount }] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("status, monthly_price_minor, payment_status, plans(name, key)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("implementation_projects")
        .select("status, progress_percent")
        .eq("business_id", businessId)
        .maybeSingle(),
      supabase
        .from("business_capabilities")
        .select("capability_key")
        .eq("business_id", businessId),
      supabase
        .from("business_memberships")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("status", "ACTIVE"),
    ]);

  const plan = Array.isArray(subscription?.plans)
    ? subscription?.plans[0]
    : subscription?.plans;

  return (
    <Business360View
      business={business}
      planName={plan?.name ?? "—"}
      planPrice={subscription?.monthly_price_minor ?? null}
      implementationStatus={project?.status ?? "—"}
      seats={`${seatCount ?? 0}`}
      capabilities={(capabilities ?? []).map((c) => c.capability_key)}
      paymentStatus={subscription?.payment_status}
    />
  );
}

function Business360View({
  business,
  planName,
  planPrice,
  implementationStatus,
  seats,
  capabilities = [],
  paymentStatus,
  preview = false,
}: {
  business: {
    id: string;
    display_name: string;
    slug: string;
    status: string;
    primary_industry: string | null;
    legal_name?: string;
    owner_name?: string | null;
    owner_email?: string | null;
    email?: string | null;
  };
  planName: string;
  planPrice: number | null;
  implementationStatus: string;
  seats: string;
  capabilities?: string[];
  paymentStatus?: string | null;
  preview?: boolean;
}) {
  return (
    <div>
      <PageHeader
        title={business.display_name}
        description={`${business.slug} · Business 360`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone={business.status === "ACTIVE" ? "success" : "warning"}>
              {business.status}
            </Badge>
            {preview ? <Badge tone="warning">Preview data</Badge> : null}
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/command/businesses"
          className="text-sm text-white/70 underline-offset-4 hover:underline"
        >
          ← All businesses
        </Link>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {SECTIONS.map((section) => (
          <a
            key={section}
            href={`#${section.toLowerCase().replaceAll(" ", "-")}`}
            className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
          >
            {section}
          </a>
        ))}
      </div>

      <section id="overview" className="mb-8 grid gap-4 md:grid-cols-4">
        {[
          { label: "Plan", value: planName },
          { label: "Monthly", value: formatTzs(planPrice) },
          { label: "Implementation", value: implementationStatus },
          { label: "Active seats", value: seats },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
              {card.label}
            </p>
            <p className="mt-2 text-xl font-semibold">{card.value}</p>
          </div>
        ))}
      </section>

      <section
        id="overview-details"
        className="mb-8 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-2"
      >
        <div>
          <h2 className="text-lg font-semibold">Overview</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-white/55">Legal name</dt>
              <dd>{business.legal_name ?? business.display_name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/55">Industry</dt>
              <dd>{business.primary_industry ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/55">Owner</dt>
              <dd>{business.owner_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/55">Owner email</dt>
              <dd>{business.owner_email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/55">Payment</dt>
              <dd>{paymentStatus ?? "—"}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Capabilities</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {capabilities.length ? (
              capabilities.map((c) => (
                <Badge key={c} tone="neutral">
                  {c}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-white/60">
                {preview
                  ? "restaurant · bar · events · reservations"
                  : "No capabilities recorded yet."}
              </p>
            )}
          </div>
        </div>
      </section>

      <section id="implementation" className="mb-8">
        <EmptyState
          title="Implementation"
          description={`Status: ${implementationStatus}. Client-visible onboarding tasks and internal QA checklist are created with the business.`}
        />
      </section>

      <section id="internal-notes" className="mb-8">
        <EmptyState
          title="Internal notes"
          description="Staff-only. Never exposed through tenant APIs or client workspace."
        />
      </section>

      <section id="workspace" className="mb-8">
        <EmptyState
          title="Workspace"
          description="Draft workspace configuration is generated on create. Composer publish lands in Phase 5."
        />
      </section>
    </div>
  );
}
