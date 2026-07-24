import type { Metadata } from "next";
import { PageHeader } from "@kasitech/ui";
import { formatTzs } from "@kasitech/entitlements";
import { requireCommandAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Plans",
};

export default async function CommandPlansPage() {
  await requireCommandAccess();
  const supabase = await createClient();

  const [{ data: plans }, { data: addons }] = await Promise.all([
    supabase
      .from("plans")
      .select("key, name, monthly_price_minor, currency, is_active, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("addons")
      .select("key, name, monthly_price_minor, currency, is_active")
      .order("name", { ascending: true }),
  ]);

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
              {(plans ?? []).map((plan) => (
                <tr key={plan.key} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-xs">{plan.key}</td>
                  <td className="px-4 py-3">{plan.name}</td>
                  <td className="px-4 py-3">
                    {formatTzs(plan.monthly_price_minor)}
                  </td>
                  <td className="px-4 py-3">{plan.is_active ? "Yes" : "No"}</td>
                </tr>
              ))}
              {!plans?.length ? (
                <tr>
                  <td className="px-4 py-6 text-white/60" colSpan={4}>
                    No plans found. Apply migration 0002_commercial.sql.
                  </td>
                </tr>
              ) : null}
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
              {(addons ?? []).map((addon) => (
                <tr key={addon.key} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-xs">{addon.key}</td>
                  <td className="px-4 py-3">{addon.name}</td>
                  <td className="px-4 py-3">
                    {formatTzs(addon.monthly_price_minor)}
                  </td>
                </tr>
              ))}
              {!addons?.length ? (
                <tr>
                  <td className="px-4 py-6 text-white/60" colSpan={3}>
                    No add-ons found. Apply migration 0002_commercial.sql.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
