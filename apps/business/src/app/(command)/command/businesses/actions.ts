"use server";

import { redirect } from "next/navigation";
import { createBusinessSchema } from "@kasitech/validation";
import { requireCommandAccess, isUsingPreviewData } from "@/lib/auth/guards";
import { createBusiness } from "@/lib/admin/create-business";
import { createServiceClient, createClient } from "@/lib/supabase/server";

export type CreateBusinessState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function formToObject(formData: FormData) {
  const capabilities = String(formData.get("capabilities") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    legalName: formData.get("legalName"),
    displayName: formData.get("displayName"),
    slug: formData.get("slug"),
    primaryIndustry: formData.get("primaryIndustry"),
    capabilities,
    description: formData.get("description") || "",
    country: formData.get("country") || "TZ",
    currency: formData.get("currency") || "TZS",
    timezone: formData.get("timezone") || "Africa/Dar_es_Salaam",
    primaryAddress: formData.get("primaryAddress") || "",
    primaryPhone: formData.get("primaryPhone") || "",
    whatsapp: formData.get("whatsapp") || "",
    email: formData.get("email") || "",
    existingWebsite: formData.get("existingWebsite") || "",
    instagram: formData.get("instagram") || "",
    planKey: formData.get("planKey"),
    implementationFeeMinor: formData.get("implementationFeeMinor") || 0,
    monthlySubscriptionMinor: formData.get("monthlySubscriptionMinor") || undefined,
    billingFrequency: formData.get("billingFrequency") || "MONTHLY",
    billingStartDate: formData.get("billingStartDate") || "",
    contractStartDate: formData.get("contractStartDate") || "",
    paymentStatus: formData.get("paymentStatus") || "PENDING",
    accentColor: formData.get("accentColor") || "",
    ownerName: formData.get("ownerName"),
    ownerEmail: formData.get("ownerEmail"),
    ownerPhone: formData.get("ownerPhone") || "",
    locationName: formData.get("locationName") || "",
  };
}

export async function createBusinessAction(
  _prev: CreateBusinessState,
  formData: FormData,
): Promise<CreateBusinessState> {
  const actor = await requireCommandAccess();

  if (isUsingPreviewData()) {
    return {
      error:
        "Preview mode: business creation is simulated only. Connect Supabase and apply migrations to create real tenants.",
    };
  }

  const parsed = createBusinessSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Prefer service role for multi-table staff writes; fall back to user client.
  let supabase;
  try {
    supabase = await createServiceClient();
  } catch {
    supabase = await createClient();
  }

  const result = await createBusiness({
    data: parsed.data,
    actorUserId: actor.userId,
    supabase,
  });

  if (!result.ok) {
    return { error: result.error.message };
  }

  redirect(`/command/businesses/${result.data.businessId}`);
}
