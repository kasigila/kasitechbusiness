"use server";

import { revalidatePath } from "next/cache";
import { generateInvitationToken } from "@kasitech/auth";
import {
  fail,
  liveSuccess,
  previewSuccess,
  usingPreview,
  type ActionMessage,
} from "@/lib/actions/result";
import { requireTenantContext } from "@/lib/auth/guards";
import { assertSeatAvailable } from "@/lib/entitlements/enforce";
import {
  countActiveSeats,
  getEffectiveEntitlements,
} from "@/lib/entitlements/load";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invitationEmailText, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function inviteTeamMemberAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const roleKey = String(formData.get("roleKey") || "STAFF").trim();

  if (!email || !email.includes("@")) return fail("Enter a valid email.");

  const limited = rateLimit({
    key: `team:invite:${email}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!limited.allowed) return fail("Too many invites. Try again shortly.");

  if (usingPreview()) {
    return previewSuccess(`Invitation queued for ${email} (preview).`, {
      email,
      roleKey,
    });
  }

  const { actor, tenant } = await requireTenantContext();
  if (!tenant.permissions.has("team.invite")) {
    return fail("You do not have permission to invite teammates.");
  }

  const entitlements = await getEffectiveEntitlements(tenant.businessId);
  if (!entitlements) return fail("Could not resolve plan entitlements.");

  const seats = await countActiveSeats(tenant.businessId);
  const seatCheck = assertSeatAvailable({
    entitlements,
    activeSeatCount: seats,
  });
  if (!seatCheck.ok) {
    return fail(seatCheck.error.message);
  }

  const supabase = await createClient();
  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .is("business_id", null)
    .eq("key", roleKey)
    .maybeSingle();

  if (!role) return fail("Selected role was not found.");

  const { token, tokenHash } = generateInvitationToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      business_id: tenant.businessId,
      email,
      role_id: role.id,
      token_hash: tokenHash,
      status: "PENDING",
      expires_at: expiresAt,
      invited_by: actor.userId,
    })
    .select("id")
    .single();

  if (error || !invitation) {
    return fail("Could not create invitation.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${token}`;

  const { data: business } = await supabase
    .from("businesses")
    .select("display_name")
    .eq("id", tenant.businessId)
    .maybeSingle();

  const emailResult = await sendEmail({
    to: email,
    subject: `You're invited to ${business?.display_name ?? "KasiTech Business"}`,
    text: invitationEmailText({
      businessName: business?.display_name ?? "your business",
      inviteUrl,
    }),
    businessId: tenant.businessId,
    templateKey: "team.invite",
  });

  try {
    const admin = createAdminClient();
    await admin.from("email_outbox").insert({
      business_id: tenant.businessId,
      to_email: email,
      subject: `You're invited to ${business?.display_name ?? "KasiTech Business"}`,
      body_text: inviteUrl,
      template_key: "team.invite",
      status: emailResult.status === "SENT" ? "SENT" : emailResult.status,
      provider_message_id: emailResult.messageId ?? null,
      error_message: emailResult.error ?? null,
      sent_at: emailResult.status === "SENT" ? new Date().toISOString() : null,
    });
  } catch {
    // outbox table may not be applied yet
  }

  await supabase.from("audit_logs").insert({
    business_id: tenant.businessId,
    actor_user_id: actor.userId,
    actor_type: "USER",
    action: "team.invite",
    resource_type: "invitation",
    resource_id: invitation.id,
    new_values: { email, roleKey },
  });

  revalidatePath("/app/team");
  return liveSuccess(
    emailResult.status === "SENT"
      ? `Invitation sent to ${email}.`
      : `Invitation created for ${email}. Email provider not configured — share link from Command if needed.`,
    { invitationId: invitation.id, inviteUrl },
  );
}
