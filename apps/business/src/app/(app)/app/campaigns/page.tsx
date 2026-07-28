import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@kasitech/ui";
import { requireActor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  await requireActor();
  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Draft WhatsApp / SMS / email campaigns to your guest list. Sending uses provider credentials when configured."
      />
      <div className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5 text-sm">
        <p>
          Campaign drafts store audience filters and copy per business. Connect a
          messaging provider later — no secrets in the browser.
        </p>
        <Link href="/app/customers" className="kb-btn kb-btn-secondary mt-4 inline-flex">
          View guests
        </Link>
      </div>
    </div>
  );
}
