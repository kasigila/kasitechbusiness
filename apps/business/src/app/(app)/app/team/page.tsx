import type { Metadata } from "next";
import Link from "next/link";
import { Badge, EmptyState, PageHeader } from "@kasitech/ui";
import { getLimit, resolveEntitlements } from "@kasitech/entitlements";
import {
  isUsingPreviewData,
  requireTenantContext,
} from "@/lib/auth/guards";
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

  if (isUsingPreviewData()) {
    const entitlements = resolveEntitlements({
      businessId: tenant.businessId,
      planKey: "PRO",
      planName: "Pro",
      planEntitlements: [
        { featureKey: "max_users", value: "10", valueType: "limit" },
      ],
    });
    const members = [
      {
        id: "1",
        name: "Demo Owner",
        email: "owner@demo.lido.test",
        role: "Business Owner",
        status: "ACTIVE",
      },
      {
        id: "2",
        name: "Amina Manager",
        email: "amina@demo.lido.test",
        role: "Manager",
        status: "ACTIVE",
      },
      {
        id: "3",
        name: "Joel Staff",
        email: "joel@demo.lido.test",
        role: "Staff",
        status: "ACTIVE",
      },
      {
        id: "4",
        name: "Grace Viewer",
        email: "grace@demo.lido.test",
        role: "Viewer",
        status: "DEACTIVATED",
      },
    ];

    return (
      <TeamView
        seats={3}
        limit={10}
        planName="Pro"
        members={members}
        hints={upgradeHintsForLimit("max_users", "PRO")}
        atLimit={false}
        canInvite
        preview
      />
    );
  }

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
  const atLimit = seats >= limit && limit > 0;

  const mapped =
    members?.map((member) => {
      const profile = Array.isArray(member.profiles)
        ? member.profiles[0]
        : member.profiles;
      const role = Array.isArray(member.roles) ? member.roles[0] : member.roles;
      return {
        id: member.id as string,
        name: profile?.full_name ?? "—",
        email: profile?.email ?? "—",
        role: role?.name ?? role?.key ?? "—",
        status: member.status as string,
      };
    }) ?? [];

  return (
    <TeamView
      seats={seats}
      limit={limit}
      planName={entitlements?.planName ?? "current"}
      members={mapped}
      hints={hints}
      atLimit={atLimit}
      canInvite={canInvite}
    />
  );
}

function TeamView(props: {
  seats: number;
  limit: number;
  planName: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  }>;
  hints: { addonKey?: string; planKey?: string };
  atLimit: boolean;
  canInvite: boolean;
  preview?: boolean;
}) {
  return (
    <div>
      <PageHeader
        title="Team"
        description={`Current seats: ${props.seats} / ${props.limit}${props.preview ? " · preview data" : ""}`}
      />

      {props.atLimit ? (
        <div className="mb-6 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4">
          <p className="font-medium">
            You&apos;ve reached your {props.planName} plan&apos;s {props.limit}-user
            limit.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {props.hints.addonKey ? (
              <UpgradeRequestForm
                requestType="ADDON"
                targetAddonKey={props.hints.addonKey}
                featureKey="max_users"
                label="Request Add-on"
              />
            ) : null}
            {props.hints.planKey ? (
              <UpgradeRequestForm
                requestType="UPGRADE_PLAN"
                targetPlanKey={props.hints.planKey}
                featureKey="max_users"
                label="Request Upgrade"
              />
            ) : null}
            <Link href="/app/billing" className="kb-btn kb-btn-ghost text-sm">
              View billing
            </Link>
          </div>
        </div>
      ) : null}

      {!props.members.length ? (
        <EmptyState
          title="No team members yet"
          description={
            props.canInvite
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
              {props.members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-[var(--kb-border)] last:border-0"
                >
                  <td className="px-4 py-3">{member.name}</td>
                  <td className="px-4 py-3">{member.email}</td>
                  <td className="px-4 py-3">{member.role}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
