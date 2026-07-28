import {
  createBusinessSchema,
  DEFAULT_ONBOARDING_TASKS,
  defaultNavigationForIndustry,
  defaultQuickActions,
  err,
  ok,
  platformError,
  type CreateBusinessInput,
  type Result,
} from "@kasitech/validation";
import { generateInvitationToken } from "@kasitech/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CreateBusinessResult = {
  businessId: string;
  slug: string;
  invitationToken?: string;
  previewOnly?: boolean;
};

/**
 * Create Business — Super Admin only.
 * Side effects (spec §5):
 * 1 tenant 2 immutable id 3 subscription 4 entitlements (via plan)
 * 5 location 6 workspace config 7 onboarding project 8 owner invitation
 * 9 audit 10 no new app code required per tenant
 */
export async function createBusiness(input: {
  data: CreateBusinessInput;
  actorUserId: string;
  supabase: SupabaseClient;
}): Promise<Result<CreateBusinessResult>> {
  const parsed = createBusinessSchema.safeParse(input.data);
  if (!parsed.success) {
    return err(
      platformError("VALIDATION_ERROR", "Check the business details.", parsed.error.flatten()),
    );
  }

  const data = parsed.data;
  const { supabase, actorUserId } = input;

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id, key, monthly_price_minor, currency")
    .eq("key", data.planKey)
    .maybeSingle();

  if (planError || !plan) {
    return err(
      platformError(
        "NOT_FOUND",
        "Selected plan was not found. Apply commercial migrations.",
      ),
    );
  }

  const { data: ownerRole } = await supabase
    .from("roles")
    .select("id")
    .is("business_id", null)
    .eq("key", "BUSINESS_OWNER")
    .maybeSingle();

  if (!ownerRole) {
    return err(
      platformError("INTERNAL_ERROR", "System BUSINESS_OWNER role is missing."),
    );
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      legal_name: data.legalName,
      display_name: data.displayName,
      slug: data.slug,
      primary_industry: data.primaryIndustry,
      description: data.description || null,
      country: data.country,
      currency: data.currency,
      timezone: data.timezone,
      primary_address: data.primaryAddress || null,
      primary_phone: data.primaryPhone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      existing_website: data.existingWebsite || null,
      instagram: data.instagram || null,
      owner_name: data.ownerName,
      owner_email: data.ownerEmail,
      owner_phone: data.ownerPhone || null,
      status: "ONBOARDING",
      lifecycle_stage: "BUSINESS_CREATED",
      created_by: actorUserId,
    })
    .select("id, slug")
    .single();

  if (businessError || !business) {
    const message =
      businessError?.code === "23505"
        ? "That business slug is already taken."
        : "Could not create business.";
    return err(platformError("CONFLICT", message, businessError));
  }

  const businessId = business.id as string;
  const monthlyPrice =
    data.monthlySubscriptionMinor ?? plan.monthly_price_minor ?? 0;

  await supabase.from("business_brand").insert({
    business_id: businessId,
    accent_color: data.accentColor || null,
  });

  if (data.capabilities.length) {
    await supabase.from("business_capabilities").insert(
      data.capabilities.map((capability_key) => ({
        business_id: businessId,
        capability_key,
      })),
    );
  }

  if (data.locationName) {
    await supabase.from("locations").insert({
      business_id: businessId,
      name: data.locationName,
      address: data.primaryAddress || null,
      phone: data.primaryPhone || null,
      email: data.email || null,
      timezone: data.timezone,
      status: "ACTIVE",
    });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .insert({
      business_id: businessId,
      plan_id: plan.id,
      status: "ONBOARDING",
      billing_frequency: data.billingFrequency,
      monthly_price_minor: monthlyPrice,
      currency: data.currency,
      billing_start_date: data.billingStartDate || null,
      contract_start_date: data.contractStartDate || null,
      payment_status: data.paymentStatus,
    })
    .select("id")
    .single();

  if (subscription) {
    await supabase.from("subscription_items").insert({
      subscription_id: subscription.id,
      item_type: "PLAN",
      description: `${data.planKey} plan`,
      quantity: 1,
      unit_price_minor: monthlyPrice,
      currency: data.currency,
    });
  }

  await supabase.from("workspace_configs").insert({
    business_id: businessId,
    status: "DRAFT",
    industry_workspace: data.primaryIndustry,
    navigation: defaultNavigationForIndustry(data.primaryIndustry),
    widgets: [
      { type: "website_visitors", size: "md" },
      { type: "catalog_views", size: "md" },
      { type: "contact_clicks", size: "sm" },
    ],
    quick_actions: defaultQuickActions(data.primaryIndustry),
    terminology: {},
  });

  const { data: project } = await supabase
    .from("implementation_projects")
    .insert({
      business_id: businessId,
      status:
        data.paymentStatus === "PAID" ? "DISCOVERY" : "PAYMENT_PENDING",
      progress_percent: 5,
    })
    .select("id")
    .single();

  if (project) {
    await supabase.from("implementation_tasks").insert(
      DEFAULT_ONBOARDING_TASKS.map((task, index) => ({
        project_id: project.id,
        title: task.title,
        is_client_visible: task.clientVisible,
        sort_order: index + 1,
        status: "TODO",
      })),
    );
  }

  const { token, tokenHash } = generateInvitationToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

  await supabase.from("invitations").insert({
    business_id: businessId,
    email: data.ownerEmail,
    role_id: ownerRole.id,
    token_hash: tokenHash,
    status: "PENDING",
    expires_at: expiresAt,
    invited_by: actorUserId,
  });

  try {
    const { invitationEmailText, sendEmail } = await import("@/lib/email");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/${token}`;
    await sendEmail({
      to: data.ownerEmail,
      subject: `You're invited to manage ${data.displayName}`,
      text: invitationEmailText({
        businessName: data.displayName,
        inviteUrl,
        ownerName: data.ownerName,
      }),
      businessId,
      templateKey: "owner.invite",
    });
  } catch {
    // Email is best-effort; invitation token still returned for Command to share.
  }

  await supabase.from("audit_logs").insert({
    business_id: businessId,
    actor_user_id: actorUserId,
    actor_type: "STAFF",
    action: "business.create",
    resource_type: "business",
    resource_id: businessId,
    new_values: {
      slug: data.slug,
      planKey: data.planKey,
      ownerEmail: data.ownerEmail,
      implementationFeeMinor: data.implementationFeeMinor,
    },
  });

  return ok({
    businessId,
    slug: business.slug as string,
    invitationToken: token,
  });
}
