import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@kasitech/ui";
import { requireActor, isUsingPreviewData } from "@/lib/auth/guards";
import { SupportForm } from "./support-form";

export const metadata: Metadata = { title: "Support" };

export default async function SupportPage() {
  await requireActor();
  const preview = isUsingPreviewData();

  return (
    <div>
      <PageHeader
        title="Support"
        description="Raise a ticket with KasiTech. For design or implementation work, use Professional Services."
      />

      <section className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5">
        <h2 className="font-semibold">New ticket</h2>
        {preview ? (
          <p className="mt-2 text-sm text-[var(--kb-muted)]">
            Preview mode — tickets persist after Supabase is connected.
          </p>
        ) : null}
        <SupportForm />
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5">
        <h2 className="font-semibold">Professional services</h2>
        <p className="mt-2 text-sm text-[var(--kb-muted)]">
          Need custom design, photography, or on-site setup? Request a scoped
          engagement from KasiTech.
        </p>
        <Link href="/app/billing" className="kb-btn kb-btn-secondary mt-4 inline-flex">
          Discuss add-ons & upgrades
        </Link>
      </section>
    </div>
  );
}
