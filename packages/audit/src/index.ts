export type AuditActorType = "USER" | "SYSTEM" | "STAFF";

export type AuditEventInput = {
  businessId?: string | null;
  actorUserId?: string | null;
  actorType: AuditActorType;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

export type AuditRecord = AuditEventInput & {
  id: string;
  createdAt: string;
};

export type AuditWriter = {
  write: (event: AuditEventInput) => Promise<AuditRecord>;
};

/** In-memory writer for unit tests — production uses Postgres append-only table. */
export function createMemoryAuditWriter(): AuditWriter & {
  events: AuditRecord[];
} {
  const events: AuditRecord[] = [];
  return {
    events,
    async write(event) {
      const record: AuditRecord = {
        ...event,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      events.push(record);
      return record;
    },
  };
}

export const SENSITIVE_ACTIONS = [
  "auth.login",
  "auth.logout",
  "team.invite",
  "team.role_change",
  "team.remove",
  "website.publish",
  "catalog.price_change",
  "customers.export",
  "billing.plan_change",
  "entitlement.override",
  "billing.payment_confirm",
  "account.suspend",
  "support.access",
  "business.create",
] as const;
