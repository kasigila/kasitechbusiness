import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@kasitech/ui";
import {
  getActiveBusinessId,
  isUsingPreviewData,
  requireActor,
} from "@/lib/auth/guards";
import { PREVIEW_BUSINESS } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const actor = await requireActor();
  const businessId = await getActiveBusinessId(actor);

  let name = PREVIEW_BUSINESS.display_name;
  let slug = PREVIEW_BUSINESS.slug;
  let timezone = PREVIEW_BUSINESS.timezone;
  let currency = PREVIEW_BUSINESS.currency;
  let country = PREVIEW_BUSINESS.country;

  if (!isUsingPreviewData() && businessId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("businesses")
      .select("display_name, slug, timezone, currency, country")
      .eq("id", businessId)
      .maybeSingle();
    if (data) {
      name = data.display_name;
      slug = data.slug;
      timezone = data.timezone;
      currency = data.currency;
      country = data.country;
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Business profile defaults. Brand tokens are managed with your KasiTech implementer."
      />

      <dl className="space-y-3 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--kb-muted)]">Name</dt>
          <dd className="font-medium">{name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--kb-muted)]">Slug</dt>
          <dd className="font-mono text-xs">{slug}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--kb-muted)]">Country</dt>
          <dd>{country}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--kb-muted)]">Timezone</dt>
          <dd>{timezone}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--kb-muted)]">Currency</dt>
          <dd>{currency}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/app/locations" className="underline underline-offset-4">
          Locations
        </Link>
        <Link href="/app/team" className="underline underline-offset-4">
          Team
        </Link>
        <Link href="/app/billing" className="underline underline-offset-4">
          Billing
        </Link>
      </div>
    </div>
  );
}
