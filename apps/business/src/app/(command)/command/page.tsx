import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@kasitech/ui";
import { requireCommandAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Command Center",
};

export default async function CommandHomePage() {
  await requireCommandAccess();
  const supabase = await createClient();

  const [
    { count: businessCount },
    { count: activeSubs },
    { count: onboardingCount },
    { count: upgradeCount },
  ] = await Promise.all([
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

  const cards = [
    { label: "Businesses", value: businessCount ?? 0, href: "/command" },
    { label: "Active subscriptions", value: activeSubs ?? 0, href: "/command/plans" },
    { label: "Onboarding", value: onboardingCount ?? 0, href: "/command" },
    { label: "Upgrade requests", value: upgradeCount ?? 0, href: "/command" },
  ];

  return (
    <div>
      <PageHeader
        title="Command Center"
        description="Internal KasiTech operations. Metrics use live commercial records when migrations are applied — no vanity placeholders."
      />

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
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
          title="Create Business arrives in Phase 3"
          description="Commercial catalog and entitlement engine are ready. Business creation will generate tenant, subscription, entitlements, workspace config, onboarding project, owner invite, and audit event."
        />
      </div>
    </div>
  );
}
