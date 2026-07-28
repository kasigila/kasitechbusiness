import type { InternalRole, Permission, SystemRole } from "@kasitech/permissions";
import {
  err,
  notFound,
  ok,
  unauthorized,
  unauthenticated,
  type Result,
} from "@kasitech/validation";

export type MembershipRecord = {
  id: string;
  businessId: string;
  userId: string;
  roleKey: SystemRole | string;
  status: "INVITED" | "ACTIVE" | "DEACTIVATED" | "REMOVED";
  permissions: Permission[];
};

export type ActorContext = {
  userId: string;
  email: string | null;
  internalRoles: InternalRole[];
  memberships: MembershipRecord[];
};

export type TenantContext = {
  userId: string;
  businessId: string;
  membershipId: string;
  roleKey: string;
  permissions: Set<Permission | string>;
  isKasitechStaff: boolean;
};

/**
 * Resolve tenant context from authenticated actor.
 * Never trust a client-supplied businessId without membership verification.
 */
export function resolveTenantContext(
  actor: ActorContext | null,
  requestedBusinessId: string | null | undefined,
): Result<TenantContext> {
  if (!actor) {
    return err(unauthenticated());
  }

  const active = actor.memberships.filter((m) => m.status === "ACTIVE");
  const isStaff = actor.internalRoles.length > 0;

  if (!requestedBusinessId) {
    if (active.length === 1) {
      return ok(toTenantContext(actor, active[0]!, isStaff));
    }
    if (active.length === 0 && isStaff) {
      return err(
        unauthorized(
          "Select a business context or use Command Center staff tools",
        ),
      );
    }
    return err(
      unauthorized("Select a business to continue"),
    );
  }

  const membership = active.find((m) => m.businessId === requestedBusinessId);
  if (!membership) {
    // Staff may later use controlled support access; Phase 1 denies silent access.
    if (isStaff) {
      return err(
        unauthorized(
          "Staff must use authorized support access to enter a tenant workspace",
        ),
      );
    }
    // Do not reveal whether the business exists.
    return err(notFound());
  }

  return ok(toTenantContext(actor, membership, isStaff));
}

function toTenantContext(
  actor: ActorContext,
  membership: MembershipRecord,
  isKasitechStaff: boolean,
): TenantContext {
  return {
    userId: actor.userId,
    businessId: membership.businessId,
    membershipId: membership.id,
    roleKey: membership.roleKey,
    permissions: new Set(membership.permissions),
    isKasitechStaff,
  };
}

export function assertPermission(
  ctx: TenantContext,
  permission: Permission,
): Result<true> {
  if (!ctx.permissions.has(permission)) {
    return err(unauthorized());
  }
  return ok(true);
}

export function isCommandCenterAllowed(actor: ActorContext | null): boolean {
  if (!actor) return false;
  return actor.internalRoles.length > 0;
}
