"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  hashInvitationToken,
  isInvitationExpired,
} from "@kasitech/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type InviteActionState = {
  error?: string;
  success?: string;
};

const acceptSchema = z.object({
  token: z.string().min(16),
  fullName: z.string().min(2).max(120),
  password: z.string().min(8).max(128),
});

export async function acceptInvitationAction(
  _prev: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error:
        "Invitation acceptance requires Supabase. Preview mode cannot activate memberships.",
    };
  }

  const parsed = acceptSchema.safeParse({
    token: formData.get("token"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter your name and a password of at least 8 characters." };
  }

  const { token, fullName, password } = parsed.data;
  const tokenHash = hashInvitationToken(token);
  const admin = createAdminClient();

  const { data: invitation } = await admin
    .from("invitations")
    .select(
      "id, business_id, email, role_id, status, expires_at, businesses(display_name)",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!invitation) {
    return { error: "This invitation link is invalid." };
  }

  if (invitation.status !== "PENDING") {
    return { error: "This invitation is no longer available." };
  }

  if (isInvitationExpired(invitation.expires_at)) {
    await admin
      .from("invitations")
      .update({ status: "EXPIRED" })
      .eq("id", invitation.id);
    return { error: "This invitation has expired. Ask KasiTech for a new invite." };
  }

  const email = invitation.email as string;

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  let userId = created?.user?.id;

  if (createError || !userId) {
    // User may already exist — try sign-in path instead.
    const supabase = await createClient();
    const { data: signedIn, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signedIn.user) {
      return {
        error:
          createError?.message?.includes("already")
            ? "An account already exists for this email. Sign in with your password, or use forgot password."
            : "Could not create your account. Try again or contact support.",
      };
    }
    userId = signedIn.user.id;
  } else {
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      return {
        error:
          "Account created but sign-in failed. Try logging in with your new password.",
      };
    }
  }

  await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName,
  });

  const { data: existingMembership } = await admin
    .from("business_memberships")
    .select("id, status")
    .eq("business_id", invitation.business_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMembership) {
    await admin
      .from("business_memberships")
      .update({
        status: "ACTIVE",
        role_id: invitation.role_id,
        joined_at: new Date().toISOString(),
      })
      .eq("id", existingMembership.id);
  } else {
    await admin.from("business_memberships").insert({
      business_id: invitation.business_id,
      user_id: userId,
      role_id: invitation.role_id,
      status: "ACTIVE",
      joined_at: new Date().toISOString(),
    });
  }

  await admin
    .from("invitations")
    .update({
      status: "ACCEPTED",
      accepted_by: userId,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  await admin.from("audit_logs").insert({
    business_id: invitation.business_id,
    actor_user_id: userId,
    actor_type: "USER",
    action: "team.invite.accept",
    resource_type: "invitation",
    resource_id: invitation.id,
  });

  redirect("/app/onboarding");
}
