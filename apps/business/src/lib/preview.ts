import type { ActorContext } from "@kasitech/tenancy";
import type { Permission } from "@kasitech/permissions";
import { ROLE_PERMISSION_DEFAULTS } from "@kasitech/permissions";

/**
 * UI preview mode lets designers/stakeholders browse shells without Supabase.
 * Never enable in production deployments.
 */
export function isPreviewUiEnabled(): boolean {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PREVIEW_UI !== "true") {
    return false;
  }
  return process.env.NEXT_PUBLIC_PREVIEW_UI === "true";
}

export const PREVIEW_BUSINESS_ID = "00000000-0000-4000-8000-000000000001";

export function getPreviewActor(kind: "owner" | "staff" = "staff"): ActorContext {
  const permissions = [
    ...ROLE_PERMISSION_DEFAULTS.BUSINESS_OWNER,
  ] as Permission[];

  return {
    userId: "00000000-0000-4000-8000-000000000099",
    email: kind === "staff" ? "admin@kasitechinnovations.com" : "owner@demo.lido.test",
    internalRoles: kind === "staff" ? ["KASITECH_SUPER_ADMIN"] : [],
    memberships: [
      {
        id: "00000000-0000-4000-8000-000000000010",
        businessId: PREVIEW_BUSINESS_ID,
        userId: "00000000-0000-4000-8000-000000000099",
        roleKey: "BUSINESS_OWNER",
        status: "ACTIVE",
        permissions,
      },
    ],
  };
}

export const PREVIEW_BUSINESS = {
  id: PREVIEW_BUSINESS_ID,
  legal_name: "Lido Slipway Limited",
  display_name: "Lido Slipway",
  slug: "lido-slipway",
  primary_industry: "hospitality",
  status: "ONBOARDING",
  country: "TZ",
  currency: "TZS",
  timezone: "Africa/Dar_es_Salaam",
  email: "hello@lido.test",
  owner_name: "Demo Owner",
  owner_email: "owner@demo.lido.test",
};

export const PREVIEW_LOCATIONS = [
  {
    id: "00000000-0000-4000-8000-000000000021",
    name: "Msasani Slipway",
    address: "Msasani Peninsula, Dar es Salaam",
    status: "ACTIVE" as const,
  },
];
