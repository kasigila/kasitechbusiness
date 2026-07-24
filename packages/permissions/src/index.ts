/**
 * Canonical permission keys. Authorization must check these server-side —
 * never infer access solely from a UI role label.
 */
export const PERMISSIONS = [
  "website.edit",
  "website.publish",
  "catalog.edit",
  "bookings.view",
  "bookings.manage",
  "customers.view",
  "customers.export",
  "team.invite",
  "team.remove",
  "team.manage_roles",
  "billing.view",
  "billing.request_upgrade",
  "analytics.view",
  "settings.edit",
  "locations.manage",
  "media.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const SYSTEM_ROLES = [
  "BUSINESS_OWNER",
  "BUSINESS_ADMIN",
  "MANAGER",
  "STAFF",
  "VIEWER",
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const INTERNAL_ROLES = [
  "KASITECH_SUPER_ADMIN",
  "KASITECH_SUPPORT",
  "KASITECH_IMPLEMENTATION",
] as const;

export type InternalRole = (typeof INTERNAL_ROLES)[number];

/** Default permission grants for system role templates. */
export const ROLE_PERMISSION_DEFAULTS: Record<SystemRole, Permission[]> = {
  BUSINESS_OWNER: [...PERMISSIONS],
  BUSINESS_ADMIN: [
    "website.edit",
    "website.publish",
    "catalog.edit",
    "bookings.view",
    "bookings.manage",
    "customers.view",
    "customers.export",
    "team.invite",
    "team.remove",
    "team.manage_roles",
    "billing.view",
    "billing.request_upgrade",
    "analytics.view",
    "settings.edit",
    "locations.manage",
    "media.manage",
  ],
  MANAGER: [
    "website.edit",
    "catalog.edit",
    "bookings.view",
    "bookings.manage",
    "customers.view",
    "team.invite",
    "analytics.view",
    "locations.manage",
    "media.manage",
  ],
  STAFF: [
    "catalog.edit",
    "bookings.view",
    "bookings.manage",
    "customers.view",
    "media.manage",
  ],
  VIEWER: ["bookings.view", "customers.view", "analytics.view", "billing.view"],
};

export function hasPermission(
  granted: Iterable<string>,
  required: Permission | Permission[],
): boolean {
  const set = granted instanceof Set ? granted : new Set(granted);
  const needed = Array.isArray(required) ? required : [required];
  return needed.every((p) => set.has(p));
}

export function isSystemRole(value: string): value is SystemRole {
  return (SYSTEM_ROLES as readonly string[]).includes(value);
}

export function isInternalRole(value: string): value is InternalRole {
  return (INTERNAL_ROLES as readonly string[]).includes(value);
}
