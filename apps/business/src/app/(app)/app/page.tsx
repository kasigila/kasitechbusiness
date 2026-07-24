import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@kasitech/ui";
import { requireActor, isUsingPreviewData } from "@/lib/auth/guards";
import { loadWorkspaceNav } from "@/lib/workspace/load";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function AppHomePage() {
  await requireActor();
  const { widgets, quickActions, terminology } = await loadWorkspaceNav();
  const preview = isUsingPreviewData();

  const widgetValues: Record<string, string> = {
    website_visitors: "1,284",
    contact_clicks: "96",
    bookings_today: "12",
    menu_activity: "48 views",
    popular_services: "Braids · 18",
    upcoming_events: "Bottomless Mimosas · Sat",
    open_service_requests: "3 open",
    qr_scans: "211",
  };

  return (
    <div>
      <PageHeader
        title={preview ? "Lido Slipway" : "Overview"}
        description={
          preview
            ? `Configured for hospitality · ${terminology.customer ?? "customer"}s · ${terminology.catalog ?? "catalog"}`
            : "Your workspace overview"
        }
      />

      {preview ? (
        <div className="mb-6 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4">
          <p className="font-medium">Onboarding in progress</p>
          <p className="mt-1 text-sm text-[var(--kb-muted)]">
            Complete discovery and assets before launch. Operational modules stay focused — not an empty enterprise dashboard.
          </p>
          <Link href="/app/onboarding" className="kb-btn kb-btn-primary mt-3 inline-flex">
            Continue onboarding
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {widgets.map((w) => (
          <div
            key={`${w.type}-${w.size}`}
            className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5"
          >
            <p className="text-sm text-[var(--kb-muted)]">
              {w.type.replaceAll("_", " ")}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
              {widgetValues[w.type] ?? "—"}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link key={action.key} href={action.href} className="kb-btn kb-btn-secondary">
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
