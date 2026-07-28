import type { ActorContext, MembershipRecord } from "@kasitech/tenancy";
import type { InternalRole, Permission } from "@kasitech/permissions";
import { isInternalRole } from "@kasitech/permissions";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type MembershipRow = {
  id: string;
  business_id: string;
  user_id: string;
  status: MembershipRecord["status"];
  roles:
    | {
        key: string;
        role_permissions: { permission_key: string }[] | null;
      }
    | {
        key: string;
        role_permissions: { permission_key: string }[] | null;
      }[]
    | null;
};

function normalizeRole(
  roles: MembershipRow["roles"],
): { key: string; permissions: Permission[] } {
  const role = Array.isArray(roles) ? roles[0] : roles;
  if (!role) {
    return { key: "VIEWER", permissions: [] };
  }
  const permissions = (role.role_permissions ?? [])
    .map((p) => p.permission_key)
    .filter(Boolean) as Permission[];
  return { key: role.key, permissions };
}

/**
 * Load authenticated actor + memberships from Postgres via Supabase RLS.
 * Returns null when unauthenticated or when Supabase is not configured.
 */
export async function getActorContext(): Promise<ActorContext | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: internalRoleRows }, { data: membershipRows }] =
    await Promise.all([
      supabase.from("internal_roles").select("role").eq("user_id", user.id),
      supabase
        .from("business_memberships")
        .select(
          `
          id,
          business_id,
          user_id,
          status,
          roles (
            key,
            role_permissions ( permission_key )
          )
        `,
        )
        .eq("user_id", user.id)
        .neq("status", "REMOVED"),
    ]);

  const internalRoles = (internalRoleRows ?? [])
    .map((row) => row.role as string)
    .filter(isInternalRole) as InternalRole[];

  const memberships: MembershipRecord[] = ((membershipRows ??
    []) as MembershipRow[]).map((row) => {
    const role = normalizeRole(row.roles);
    return {
      id: row.id,
      businessId: row.business_id,
      userId: row.user_id,
      roleKey: role.key,
      status: row.status,
      permissions: role.permissions,
    };
  });

  return {
    userId: user.id,
    email: user.email ?? null,
    internalRoles,
    memberships,
  };
}
