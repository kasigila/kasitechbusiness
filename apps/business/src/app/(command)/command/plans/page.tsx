import type { Metadata } from "next";
import { PageHeader } from "@kasitech/ui";
import { formatTzs } from "@kasitech/entitlements";
import {
  isUsingPreviewData,
  requireCommandAccess,
} from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Plans",
};

const PREVIEW_PLANS = [
  { key: "LAUNCH", name: "Launch", monthly_price_minor: 150000, is_active: true },
  { key: "GROWTH", name: "Growth", monthly_price_minor: 400000, is_active: true },
  { key: "PRO", name: "Pro", monthly_price_minor: 800000, is_active: true },
  { key: "SCALE", name: "Scale", monthly_price_minor: 1500000, is_active: true },
  { key: "ENTERPRISE", name: "Enterprise", monthly_price_minor: null, is_active: true },
];

const PREVIEW_ADDONS = [
  { key: "TEAM_PACK", name: "Team Pack", monthly_price_minor: 75000 },
  { key: "ADDITIONAL_LOCATION", name: "Additional Location", monthly_price_minor: 100000 },
  { key: "QR_PACK", name: "QR Pack", monthly_price_minor: 50000 },
  { key: "KASI_REWARDS", name: "KasiRewards", monthly_price_minor: 150000 },
];

export default async function CommandPlansPage() {
  await requireCommandAccess();

  let plans = PREVIEW_PLANS;
  let addons = PREVIEW_ADDONS;

  if (!isUsingPreviewData()) {
    const supabase = await createClient();
    const [{ data: planRows }, { data: addonRows }] = await Promise.all([
      supabase
        .from("plans")
        .select("key, name, monthly_price_minor, currency, is_active, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("addons")
        .select("key, name, monthly_price_minor, currency, is_active")
        .order("name", { ascending: true }),
    ]);
    plans = (planRows as typeof PREVIEW_PLANS) ?? [];
    addons = (addonRows as typeof PREVIEW_ADDONS) ?? [];
  }

  return (
    <div>
      <PageHeader
        title="Plans & add-ons"
        description="Commercial catalog is database-configured. Prices and entitlements are not hard-coded in UI logic."
      />

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Plans</h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.key} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-xs">{plan.key}</td>
                  <td className="px-4 py-3">{plan.name}</td>
                  <td className="px-4 py-3">
                    {formatTzs(plan.monthly_price_minor)}
                  </td>
                  <td className="px-4 py-3">{plan.is_active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Add-ons</h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {addons.map((addon) => (
                <tr key={addon.key} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-xs">{addon.key}</td>
                  <td className="px-4 py-3">{addon.name}</td>
                  <td className="px-4 py-3">
                    {formatTzs(addon.monthly_price_minor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
