import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@kasitech/ui";
import { requireActor, isUsingPreviewData } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requireActor();
  const preview = isUsingPreviewData();

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Snapshot metrics for this business. Deep reporting ships with Growth+."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Website views (7d)", preview ? "1,284" : "—"],
          ["Bookings (7d)", preview ? "47" : "—"],
          ["QR scans (7d)", preview ? "211" : "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5"
          >
            <p className="text-sm text-[var(--kb-muted)]">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
              {value}
            </p>
          </div>
        ))}
      </div>

      {preview ? (
        <p className="mt-6 text-sm text-[var(--kb-muted)]">
          Preview counters are illustrative. Connect Supabase and emit events from
          public surfaces to populate analytics_events.{" "}
          <Link href="/app/billing" className="underline underline-offset-4">
            Review plan analytics entitlements
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
