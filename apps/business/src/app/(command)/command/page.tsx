import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@kasitech/ui";
import {
  isUsingPreviewData,
  requireCommandAccess,
} from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Command Center",
};

export default async function CommandHomePage() {
  await requireCommandAccess();

  let businessCount = 2;
  let activeSubs = 1;
  let onboardingCount = 1;
  let upgradeCount = 0;

  if (!isUsingPreviewData()) {
    const supabase = await createClient();
    const [a, b, c, d] = await Promise.all([
      supabase.from("businesses").select("id", { count: "exact", head: true }),
      supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "ACTIVE"),
      supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("status", "ONBOARDING"),
      supabase
        .from("upgrade_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "REQUESTED"),
    ]);
    businessCount = a.count ?? 0;
    activeSubs = b.count ?? 0;
    onboardingCount = c.count ?? 0;
    upgradeCount = d.count ?? 0;
  }

  const cards = [
    { label: "Businesses", value: businessCount, href: "/command/businesses" },
    { label: "Active subscriptions", value: activeSubs, href: "/command/plans" },
    { label: "Onboarding", value: onboardingCount, href: "/command/businesses" },
    { label: "Upgrade requests", value: upgradeCount, href: "/command/businesses" },
  ];

  return (
    <div>
      <PageHeader
        title="Command Center"
        description="Internal KasiTech operations. Metrics use live commercial records when migrations are applied."
      />

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href="/command/businesses" className="underline-offset-4 hover:underline">
          Businesses
        </Link>
        <Link href="/command/businesses/new" className="underline-offset-4 hover:underline">
          Create Business
        </Link>
        <Link href="/command/plans" className="underline-offset-4 hover:underline">
          Plans & add-ons
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <EmptyState
          title="Create Business is ready"
          description="Creates tenant, subscription, workspace draft, implementation project, owner invitation, and audit event in one action."
          action={
            <Link
              href="/command/businesses/new"
              className="kb-btn kb-btn-primary"
            >
              + Create Business
            </Link>
          }
        />
      </div>
    </div>
  );
}
