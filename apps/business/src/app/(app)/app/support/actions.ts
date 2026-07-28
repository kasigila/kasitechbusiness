"use server";

import { revalidatePath } from "next/cache";
import {
  fail,
  liveSuccess,
  previewSuccess,
  usingPreview,
  type ActionMessage,
} from "@/lib/actions/result";
import { requireTenantContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function submitSupportTicketAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const subject = String(formData.get("subject") || "").trim();
  const description = String(formData.get("body") || formData.get("description") || "").trim();
  const category = String(formData.get("category") || "GENERAL").trim();

  if (!subject || !description) {
    return fail("Subject and details are required.");
  }

  const limited = rateLimit({
    key: `support:${subject.slice(0, 24)}`,
    limit: 8,
    windowMs: 60_000,
  });
  if (!limited.allowed) return fail("Too many tickets. Try again shortly.");

  if (usingPreview()) {
    return previewSuccess("Ticket submitted (preview). Connect Supabase to persist.", {
      subject,
    });
  }

  const { actor, tenant } = await requireTenantContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      business_id: tenant.businessId,
      created_by: actor.userId,
      category,
      subject,
      description,
      priority: "NORMAL",
      status: "OPEN",
    })
    .select("id")
    .single();

  if (error || !data) return fail("Could not create support ticket.");

  await supabase.from("audit_logs").insert({
    business_id: tenant.businessId,
    actor_user_id: actor.userId,
    actor_type: "USER",
    action: "support.access",
    resource_type: "support_ticket",
    resource_id: data.id,
    new_values: { subject, category },
  });

  revalidatePath("/app/support");
  return liveSuccess("Ticket submitted. KasiTech will follow up.");
}

export async function submitProfessionalServiceAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const subject = String(formData.get("subject") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const requestType = String(formData.get("requestType") || "OTHER").trim();

  if (!subject || !description) return fail("Subject and description are required.");

  if (usingPreview()) {
    return previewSuccess("Professional services request queued (preview).");
  }

  const { actor, tenant } = await requireTenantContext();
  const supabase = await createClient();

  const { error } = await supabase.from("professional_service_requests").insert({
    business_id: tenant.businessId,
    requested_by: actor.userId,
    request_type: requestType,
    subject,
    description,
    status: "REQUESTED",
  });

  if (error) return fail("Could not submit request.");

  revalidatePath("/app/support");
  return liveSuccess("Request submitted. KasiTech will scope and quote.");
}
