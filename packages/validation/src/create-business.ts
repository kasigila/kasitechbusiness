import { z } from "zod";

export const createBusinessSchema = z.object({
  legalName: z.string().min(2).max(200),
  displayName: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, hyphens"),
  primaryIndustry: z.string().min(2).max(80),
  capabilities: z.array(z.string().min(1).max(80)).default([]),
  description: z.string().max(2000).optional().or(z.literal("")),
  country: z.string().min(2).max(8).default("TZ"),
  currency: z.string().min(3).max(8).default("TZS"),
  timezone: z.string().min(3).max(80).default("Africa/Dar_es_Salaam"),
  primaryAddress: z.string().max(500).optional().or(z.literal("")),
  primaryPhone: z.string().max(40).optional().or(z.literal("")),
  whatsapp: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  existingWebsite: z.string().url().optional().or(z.literal("")),
  instagram: z.string().max(200).optional().or(z.literal("")),
  planKey: z.enum(["LAUNCH", "GROWTH", "PRO", "SCALE", "ENTERPRISE"]),
  implementationFeeMinor: z.coerce.number().int().min(0).default(0),
  monthlySubscriptionMinor: z.coerce.number().int().min(0).optional(),
  billingFrequency: z.enum(["MONTHLY", "YEARLY", "CUSTOM"]).default("MONTHLY"),
  billingStartDate: z.string().optional().or(z.literal("")),
  contractStartDate: z.string().optional().or(z.literal("")),
  paymentStatus: z
    .enum(["PENDING", "PAID", "FAILED", "OVERDUE", "REFUNDED", "VOID"])
    .default("PENDING"),
  accentColor: z.string().max(32).optional().or(z.literal("")),
  ownerName: z.string().min(2).max(200),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().max(40).optional().or(z.literal("")),
  locationName: z.string().max(200).optional().or(z.literal("")),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

export const DEFAULT_ONBOARDING_TASKS = [
  { title: "Complete business profile", clientVisible: true },
  { title: "Complete discovery questionnaire", clientVisible: true },
  { title: "Upload logo", clientVisible: true },
  { title: "Upload brand guidelines", clientVisible: true },
  { title: "Upload photos", clientVisible: true },
  { title: "Provide products/services/menu", clientVisible: true },
  { title: "Provide contact details & hours", clientVisible: true },
  { title: "Connect/confirm social profiles", clientVisible: true },
  { title: "Review website", clientVisible: true },
  { title: "Approve website", clientVisible: true },
  { title: "Complete training", clientVisible: true },
  { title: "Internal: configure workspace modules", clientVisible: false },
  { title: "Internal: QA checklist", clientVisible: false },
] as const;

export function defaultNavigationForIndustry(industry: string): unknown[] {
  const base = [
    { key: "overview", label: "Overview", href: "/app" },
    { key: "website", label: "Website", href: "/app/website", group: "WEBSITE" },
    { key: "catalog", label: "Products / Services", href: "/app/catalog", group: "WEBSITE" },
    { key: "analytics", label: "Analytics", href: "/app/analytics", group: "INSIGHTS" },
    { key: "team", label: "Team", href: "/app/team", group: "MANAGEMENT" },
    { key: "billing", label: "Billing", href: "/app/billing", group: "ACCOUNT" },
    { key: "support", label: "Support", href: "/app/support", group: "ACCOUNT" },
  ];

  if (industry === "hospitality" || industry === "beauty_wellness") {
    base.splice(3, 0, {
      key: "bookings",
      label: industry === "beauty_wellness" ? "Appointments" : "Reservations",
      href: "/app/bookings",
      group: "OPERATIONS",
    });
  }

  return base;
}

export function defaultQuickActions(industry: string): unknown[] {
  return [
    { key: "edit_website", label: "Edit Website", href: "/app/website" },
    { key: "add_catalog", label: "Add Product/Service", href: "/app/catalog/new" },
    {
      key: "view_bookings",
      label: industry === "beauty_wellness" ? "View Appointments" : "View Reservations",
      href: "/app/bookings",
    },
  ];
}
