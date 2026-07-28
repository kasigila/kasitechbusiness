/**
 * Billing suspension / restriction policy evaluator.
 * Call from a scheduled job or Command action — never from the client alone.
 */

export type BusinessLifecycleStatus =
  | "ONBOARDING"
  | "ACTIVE"
  | "PAST_DUE"
  | "GRACE_PERIOD"
  | "RESTRICTED"
  | "SUSPENDED"
  | "TERMINATED";

export type SubscriptionPaymentSnapshot = {
  subscriptionStatus: string;
  paymentStatus: string;
  daysPastDue: number;
};

export type PolicyDecision = {
  nextStatus: BusinessLifecycleStatus;
  reason: string;
  restrictWorkspace: boolean;
};

const GRACE_DAYS = 7;
const RESTRICT_AFTER_DAYS = 14;
const SUSPEND_AFTER_DAYS = 30;

export function evaluateBillingPolicy(
  current: BusinessLifecycleStatus,
  snap: SubscriptionPaymentSnapshot,
): PolicyDecision | null {
  if (current === "TERMINATED" || current === "ONBOARDING") {
    return null;
  }

  const unpaid =
    snap.paymentStatus === "PAST_DUE" ||
    snap.paymentStatus === "FAILED" ||
    snap.subscriptionStatus === "PAST_DUE";

  if (!unpaid && (current === "PAST_DUE" || current === "GRACE_PERIOD" || current === "RESTRICTED" || current === "SUSPENDED")) {
    return {
      nextStatus: "ACTIVE",
      reason: "Payment restored",
      restrictWorkspace: false,
    };
  }

  if (!unpaid) return null;

  if (snap.daysPastDue >= SUSPEND_AFTER_DAYS) {
    return {
      nextStatus: "SUSPENDED",
      reason: `Unpaid for ${snap.daysPastDue} days`,
      restrictWorkspace: true,
    };
  }

  if (snap.daysPastDue >= RESTRICT_AFTER_DAYS) {
    return {
      nextStatus: "RESTRICTED",
      reason: `Unpaid for ${snap.daysPastDue} days — publishing and invites restricted`,
      restrictWorkspace: true,
    };
  }

  if (snap.daysPastDue >= GRACE_DAYS) {
    return {
      nextStatus: "GRACE_PERIOD",
      reason: `Unpaid for ${snap.daysPastDue} days — grace period`,
      restrictWorkspace: false,
    };
  }

  return {
    nextStatus: "PAST_DUE",
    reason: "Payment past due",
    restrictWorkspace: false,
  };
}

export function isMutatingRestricted(status: BusinessLifecycleStatus): boolean {
  return status === "RESTRICTED" || status === "SUSPENDED" || status === "TERMINATED";
}
