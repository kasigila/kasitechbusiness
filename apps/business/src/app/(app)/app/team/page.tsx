import type { Metadata } from "next";
import Link from "next/link";
import { Badge, EmptyState, PageHeader } from "@kasitech/ui";
import { getLimit } from "@kasitech/entitlements";
import { requireTenantContext } from "@/lib/auth/guards";
import {
  countActiveSeats,
  getEffectiveEntitlements,
  upgradeHintsForLimit,
} from "@/lib/entitlements/load";
import { createClient } from "@/lib/supabase/server";
import { UpgradeRequestForm } from "../billing/upgrade-form";

export const metadata: Metadata = {
  title: "Team",
};

export default async function TeamPage() {
  const { tenant } = await requireTenantContext();
  const entitlements = await getEffectiveEntitlements(tenant.businessId);
  const seats = await countActiveSeats(tenant.businessId);
  const limit = entitlements ? getLimit(entitlements, "max_users") : 0;
  const hints = upgradeHintsForLimit("max_users", entitlements?.planKey ?? null);

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("business_memberships")
    .select(
      `
      id,
      status,
      joined_at,
      profiles ( full_name, email ),
      roles ( key, name )
    `,
    )
    .eq("business_id", tenant.businessId)
    .neq("status", "REMOVED")
    .order("created_at", { ascending: true });

  const canInvite = tenant.permissions.has("team.invite");
  const atLimit = seats >= limit;

  return (
    <div>
      <PageHeader
        title="Team"
        description={`Current seats: ${seats} / ${limit}`}
      />

      {atLimit ? (
        <div className="mb-6 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4">
          <p className="font-medium">
            You&apos;ve reached your {entitlements?.planName ?? "current"} plan&apos;s{" "}
            {limit}-user limit.
          </p>
          <p className="mt-1 text-sm text-[var(--kb-muted)]">
            Request an add-on or higher plan. KasiTech reviews requests — no silent upgrades.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {hints.addonKey ? (
              <UpgradeRequestForm
                requestType="ADDON"
                targetAddonKey={hints.addonKey}
                featureKey="max_users"
                label="Request Add-on"
              />
            ) : null}
            {hints.planKey ? (
              <UpgradeRequestForm
                requestType="UPGRADE_PLAN"
                targetPlanKey={hints.planKey}
                featureKey="max_users"
                label="Request Upgrade"
              />
            ) : null}
            <Link
              href="/app/billing"
              className="kb-btn kb-btn-ghost text-sm"
            >
              View billing
            </Link>
          </div>
        </div>
      ) : null}

      {!members?.length ? (
        <EmptyState
          title="No team members yet"
          description={
            canInvite
              ? "Invite coworkers when onboarding is ready. Seat limits are enforced server-side."
              : "You don't have permission to manage team members."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--kb-border)] text-[var(--kb-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const profile = Array.isArray(member.profiles)
                  ? member.profiles[0]
                  : member.profiles;
                const role = Array.isArray(member.roles)
                  ? member.roles[0]
                  : member.roles;
                return (
                  <tr
                    key={member.id}
                    className="border-b border-[var(--kb-border)] last:border-0"
                  >
                    <td className="px-4 py-3">
                      {profile?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">{profile?.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      {role?.name ?? role?.key ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          member.status === "ACTIVE"
                            ? "success"
                            : member.status === "DEACTIVATED"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {member.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
