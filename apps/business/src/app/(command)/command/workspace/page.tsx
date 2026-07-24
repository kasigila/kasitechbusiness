import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@kasitech/ui";
import { recommendWorkspace } from "@kasitech/workspace";
import { requireCommandAccess } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Workspace composer" };

export default async function CommandWorkspaceComposerPage() {
  await requireCommandAccess();

  const example = recommendWorkspace({
    industry: "hospitality",
    sells: ["food", "drinks", "experiences"],
    operations: ["reservations", "tables", "events", "customers"],
    morningPriorities: ["reservations", "service_requests"],
  });

  return (
    <div>
      <PageHeader
        title="Workspace composer"
        description="Draft module, nav, and widget recommendations from discovery signals. Publish per business from the 360 view after review."
      />

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
        <h2 className="font-semibold">Example: hospitality draft</h2>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
            Terminology
          </p>
          <p className="mt-1 font-mono text-xs text-white/85">
            {Object.entries(example.terminology)
              .map(([k, v]) => `${k}=${v}`)
              .join(" · ") || "defaults"}
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
            Navigation
          </p>
          <p className="mt-1 font-mono text-xs text-white/85">
            {example.navigation.map((n) => n.label).join(" → ")}
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
            Widgets
          </p>
          <p className="mt-1 font-mono text-xs text-white/85">
            {example.widgets.map((w) => w.type).join(", ")}
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
            Quick actions
          </p>
          <p className="mt-1 font-mono text-xs text-white/85">
            {example.quickActions.map((a) => a.label).join(" · ")}
          </p>
        </div>
      </section>

      <p className="mt-6 text-sm text-white/70">
        Open a business to attach a published workspace config:{" "}
        <Link href="/command/businesses" className="underline underline-offset-4">
          Businesses
        </Link>
        {" · "}
        <Link href="/command/discovery" className="underline underline-offset-4">
          Discovery queue
        </Link>
      </p>
    </div>
  );
}
