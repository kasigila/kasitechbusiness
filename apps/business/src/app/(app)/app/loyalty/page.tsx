import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@kasitech/ui";
import { requireActor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Loyalty" };

export default async function LoyaltyPage() {
  await requireActor();
  return (
    <div>
      <PageHeader
        title="Loyalty / Rewards"
        description="Points and member balances for this business only. Enable via the Kasi Rewards add-on."
      />
      <div className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5 text-sm">
        <p>
          Create a loyalty program, enroll guests by phone, and track a points
          ledger. Schema is ready in migration <code>0005</code>.
        </p>
        <Link href="/app/billing" className="kb-btn kb-btn-secondary mt-4 inline-flex">
          Request Kasi Rewards add-on
        </Link>
      </div>
    </div>
  );
}
