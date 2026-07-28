import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@kasitech/ui";
import { requireActor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Automation" };

export default async function AutomationPage() {
  await requireActor();
  return (
    <div>
      <PageHeader
        title="Automation"
        description="Simple trigger → action rules (new booking, no-show, open ticket). Enable via Kasi Automate."
      />
      <div className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5 text-sm">
        <p>
          Rules and run history tables ship in migration <code>0005</code>. Start
          with notifications to owners before wiring external messengers.
        </p>
        <Link href="/app/billing" className="kb-btn kb-btn-secondary mt-4 inline-flex">
          Request automation add-on
        </Link>
      </div>
    </div>
  );
}
