/**
 * Database package entry — SQL migrations live in ./migrations.
 * Runtime Supabase clients are constructed in the Next.js app with cookies.
 */

export const FOUNDATION_MIGRATION = "0001_foundation.sql";
export const COMMERCIAL_MIGRATION = "0002_commercial.sql";

export const MIGRATIONS = [
  FOUNDATION_MIGRATION,
  COMMERCIAL_MIGRATION,
] as const;

export type BusinessStatus =
  | "ONBOARDING"
  | "ACTIVE"
  | "PAST_DUE"
  | "GRACE_PERIOD"
  | "RESTRICTED"
  | "SUSPENDED"
  | "TERMINATED";

export type MembershipStatus =
  | "INVITED"
  | "ACTIVE"
  | "DEACTIVATED"
  | "REMOVED";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export type BusinessRow = {
  id: string;
  legal_name: string;
  display_name: string;
  slug: string;
  primary_industry: string | null;
  status: BusinessStatus;
  country: string;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};
